import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Users, 
  MessageSquare,
  Send,
  X,
  Tv,
  Radio,
  Download,
  Info,
  Maximize2,
  Minimize2,
  ChevronLeft,
  UserCheck
} from 'lucide-react';

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() as any;
  const { theme } = useTheme() as any;

  // Meeting metadata states
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false); // Lobby vs Room state

  // Media toggle states
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Panels toggle states
  const [activePanel, setActivePanel] = useState(null); // 'chat', 'participants', or null

  // Sockets & WebRTC states
  const [socket, setSocket] = useState(null);
  const [peers, setPeers] = useState([]); // Array of remote peer objects
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // mapping socketId -> userName

  // Refs for media and peer connections
  const localVideoRef = useRef(null);
  const lobbyVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const typingTimeoutRef = useRef(null);
  const recIntervalRef = useRef(null);

  // Fetch meeting metadata on load
  useEffect(() => {
    fetchMeeting();
    
    // Acquire temporary lobby stream for settings check
    setupLobbyStream();

    return () => {
      cleanupMedia();
    };
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const res = await api.get(`/meetings/${id}`);
      setMeeting(res.data);
    } catch (error) {
      console.error('Error fetching meeting:', error);
      alert('Meeting not found or access denied');
      navigate('/meetings');
    } finally {
      setLoading(false);
    }
  };

  const setupLobbyStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      localStreamRef.current = stream;
      if (lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error acquiring lobby preview stream:', err);
    }
  };

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    if (recIntervalRef.current) clearInterval(recIntervalRef.current);
    if (socket) socket.disconnect();
  };

  // Join Call action
  const handleJoinCall = () => {
    setIsJoined(true);
    
    // Release the lobby ref and bind to call ref
    setTimeout(() => {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      initializeSocketConnection();

      // Auto-start recording if enabled for this meeting AND current user is the host
      const isHost = meeting && user && (
        meeting.host === user.id || 
        meeting.host === user._id || 
        (meeting.host && typeof meeting.host === 'object' && (meeting.host._id === user.id || meeting.host._id === user._id))
      );
      if (meeting?.recordMeeting && isHost) {
        setTimeout(() => {
          startRecording();
        }, 1000);
      }
    }, 100);
  };

  // Setup sockets & signaling
  const initializeSocketConnection = () => {
    const viteApiUrl = (import.meta as any).env.VITE_API_URL;
    const socketUrl = viteApiUrl 
      ? new URL(viteApiUrl).origin 
      : 'http://localhost:3000';

    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.emit('join-room', {
      roomId: id,
      userId: user?.id || user?._id || 'guest',
      userName: user?.name || 'Guest User',
      userAvatar: user?.avatar || '',
      audioEnabled,
      videoEnabled
    });

    // 1. Get other active users list from server
    newSocket.on('room-users', (users) => {
      users.forEach(peerInfo => {
        initiatePeerConnection(newSocket, peerInfo.socketId, peerInfo, true);
      });
    });

    // 2. Hear when a user joins the room
    newSocket.on('user-joined', (peerInfo) => {
      // Create connection but do NOT offer immediately (we wait for their offer or create offer)
      initiatePeerConnection(newSocket, peerInfo.socketId, peerInfo, false);
    });

    // 3. Receive WebRTC SDP Offers
    newSocket.on('signal-offer', async ({ senderSocketId, offer }) => {
      let pc = peerConnectionsRef.current.get(senderSocketId);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit('signal-answer', {
          targetSocketId: senderSocketId,
          answer
        });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    // 4. Receive WebRTC SDP Answers
    newSocket.on('signal-answer', async ({ senderSocketId, answer }) => {
      const pc = peerConnectionsRef.current.get(senderSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote answer:', err);
        }
      }
    });

    // 5. Receive WebRTC ICE Candidates
    newSocket.on('signal-ice', async ({ senderSocketId, candidate }) => {
      const pc = peerConnectionsRef.current.get(senderSocketId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // 6. Handle user left
    newSocket.on('user-left', ({ socketId }) => {
      const pc = peerConnectionsRef.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(socketId);
      }
      setPeers(prev => prev.filter(p => p.socketId !== socketId));
    });

    // 7. Receive Chat message
    newSocket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    // 8. Receive Typing Indicators
    newSocket.on('user-typing', ({ socketId, userName, isTyping }) => {
      setTypingUsers(prev => {
        const copy = { ...prev };
        if (isTyping) {
          copy[socketId] = userName;
        } else {
          delete copy[socketId];
        }
        return copy;
      });
    });

    // 9. Receive user status toggles
    newSocket.on('user-device-status', ({ socketId, type, enabled }) => {
      setPeers(prev => prev.map(p => {
        if (p.socketId === socketId) {
          return {
            ...p,
            audioEnabled: type === 'audio' ? enabled : p.audioEnabled,
            videoEnabled: type === 'video' ? enabled : p.videoEnabled
          };
        }
        return p;
      }));
    });
  };

  // Setup WebRTC peer connection
  const initiatePeerConnection = async (currentSocket, targetSocketId, peerInfo, isInitiator) => {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(configuration);
    
    peerConnectionsRef.current.set(targetSocketId, pc);

    // Add local media stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        currentSocket.emit('signal-ice', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Receive remote tracks
    const remoteStream = new MediaStream();
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });

      // Save peer to state
      setPeers(prev => {
        const index = prev.findIndex(p => p.socketId === targetSocketId);
        const peerObj = {
          socketId: targetSocketId,
          userId: peerInfo.userId,
          userName: peerInfo.userName,
          userAvatar: peerInfo.userAvatar,
          stream: remoteStream,
          audioEnabled: peerInfo.audioEnabled,
          videoEnabled: peerInfo.videoEnabled
        };

        if (index > -1) {
          const copy = [...prev];
          copy[index] = peerObj;
          return copy;
        } else {
          return [...prev, peerObj];
        }
      });
    };

    // If initiator, create the SDP offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        currentSocket.emit('signal-offer', {
          targetSocketId,
          offer
        });
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    }
  };

  // Local Device Toggles
  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) track.enabled = nextState;
    }
    if (socket) {
      socket.emit('toggle-audio', { roomId: id, enabled: nextState });
    }
  };

  const handleToggleVideo = () => {
    const nextState = !videoEnabled;
    setVideoEnabled(nextState);
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) track.enabled = nextState;
    }
    // Update srcObject on lobby video if not joined yet
    if (!isJoined && lobbyVideoRef.current && localStreamRef.current) {
      lobbyVideoRef.current.srcObject = localStreamRef.current;
    }
    if (socket) {
      socket.emit('toggle-video', { roomId: id, enabled: nextState });
    }
  };

  // Screen Share Handler
  const handleToggleScreenShare = async () => {
    if (!isJoined) return;

    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        // Replace track in all peer connections
        peerConnectionsRef.current.forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        // Set local preview to show screenshare
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Handle browser stop sharing button
        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    const cameraTrack = localStreamRef.current.getVideoTracks()[0];

    // Revert track in all peer connections
    peerConnectionsRef.current.forEach(pc => {
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(cameraTrack);
      }
    });

    // Revert local preview
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
  };

  const getSupportedMimeType = () => {
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      const candidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=h264,aac',
        'video/mp4'
      ];
      for (const candidate of candidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }
    }
    return mimeType;
  };

  const startRecording = () => {
    if (!localStreamRef.current) return;
    recordedChunksRef.current = [];
    const mimeType = getSupportedMimeType();
    const options = { mimeType };
    
    try {
      const recorder = new MediaRecorder(localStreamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `meeting-rec-${id}-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        // Upload audio and request transcription
        setIsTranscribing(true);
        const formData = new FormData();
        formData.append('audio', blob, `meeting-audio.${extension}`);
        api.post(`/meetings/${id}/transcribe`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(() => {
          alert('Recording uploaded and transcribed successfully!');
        }).catch(err => {
          console.error('Failed to upload audio recording', err);
          alert('Failed to upload audio recording: ' + (err.response?.data?.message || err.message));
        }).finally(() => {
          setIsTranscribing(false);
        });
      };

      recorder.start(1000); // chunk every 1 sec
      setIsRecording(true);
      setRecDuration(0);

      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
      recIntervalRef.current = setInterval(() => {
        setRecDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting media recorder:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recIntervalRef.current) {
      clearInterval(recIntervalRef.current);
      recIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  // Call Recording Handler
  const handleToggleRecording = () => {
    if (!isJoined) return;

    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Chat message submission
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send-chat-message', {
      roomId: id,
      messageText: newMessage.trim(),
      senderName: user?.name || 'Anonymous',
      senderId: user?.id || user?._id || 'guest'
    });

    setNewMessage('');
    
    // Stop typing immediately
    socket.emit('user-typing', { roomId: id, isTyping: false, userName: user?.name });
  };

  // Handle typing key presses
  const handleChatKeyPress = () => {
    if (!socket) return;
    
    // Send typing event
    socket.emit('user-typing', { roomId: id, isTyping: true, userName: user?.name });

    // Debounce stops typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('user-typing', { roomId: id, isTyping: false, userName: user?.name });
    }, 2000);
  };

  // Panel toggles
  const handleTogglePanel = (panelName) => {
    if (activePanel === panelName) {
      setActivePanel(null);
    } else {
      setActivePanel(panelName);
    }
  };

  // Exit meeting room
  const handleLeaveMeeting = () => {
    cleanupMedia();
    navigate('/meetings');
  };

  // Helper to draw remote peer videos on track load
  const RemoteVideoTile = ({ peer }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (videoRef.current && peer.stream) {
        videoRef.current.srcObject = peer.stream;
      }
    }, [peer.stream]);

    return (
      <div className="relative bg-secondary-bg rounded-3xl overflow-hidden border border-border-color shadow-2xl flex items-center justify-center group aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${!peer.videoEnabled ? 'hidden' : ''}`}
        ></video>
        {!peer.videoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-4xl text-zinc-400 font-extrabold shadow-inner">
              {peer.userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-glass-bg border border-border-color px-3 py-1.5 rounded-lg backdrop-blur-md text-xs font-semibold text-text-main shadow flex items-center gap-1.5">
          <span>{peer.userName}</span>
          {!peer.audioEnabled && <MicOff size={14} className="text-red-500" />}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex justify-center items-center text-text-main font-sans">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-text-main mb-4"></div>
          <div className="text-lg font-medium text-text-muted animate-pulse">Connecting to server...</div>
        </div>
      </div>
    );
  }

  /* ------------------- LOBBY VIEW ------------------- */
  if (!isJoined) {
    return (
      <div className="min-h-screen w-full bg-primary-bg text-text-main font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in-up">
          {/* Left Panel: Camera Preview */}
          <div className="space-y-4">
            <div className="relative bg-secondary-bg border border-border-color aspect-video rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
              <video 
                ref={lobbyVideoRef}
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`}
              />
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-955">
                  <div className="w-28 h-28 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center text-5xl text-zinc-500 font-extrabold shadow-inner">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              
              {/* Media Controls Layer */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`p-3 rounded-full border shadow-lg transition-all ${
                    audioEnabled 
                      ? 'bg-zinc-800/80 border-zinc-700 text-white hover:bg-zinc-700' 
                      : 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                  }`}
                >
                  {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-full border shadow-lg transition-all ${
                    videoEnabled 
                      ? 'bg-zinc-800/80 border-zinc-700 text-white hover:bg-zinc-700' 
                      : 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                  }`}
                >
                  {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Join details */}
          <div className="space-y-6 bg-secondary-bg p-5 sm:p-8 rounded-3xl border border-border-color shadow-2xl">
            <div>
              <Link to="/meetings" className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors mb-3 bg-transparent border-none cursor-pointer no-underline">
                <ChevronLeft size={14} />
                Back to Dashboard
              </Link>
              <h2 className="text-2xl font-extrabold tracking-tight">{meeting?.title}</h2>
              <p className="text-sm text-text-muted font-mono mt-1 bg-primary-bg px-3 py-1.5 rounded-xl border border-border-color inline-block">
                Room Code: {meeting?.meetingCode}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border-color">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Joining as</span>
                <p className="text-sm font-semibold flex items-center gap-1.5 text-text-main">
                  <UserCheck size={16} className="text-text-muted" />
                  {user?.name}
                </p>
              </div>
            </div>

            <button
              onClick={handleJoinCall}
              className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-base px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer"
            >
              <Video size={20} />
              <span>Join Meeting</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------- ACTIVE CALL ROOM VIEW ------------------- */
  const typingList = Object.values(typingUsers);

  return (
    <div className="min-h-screen w-full bg-primary-bg flex flex-col font-sans text-text-main overflow-hidden">
      {/* Room Header */}
      <header className="bg-secondary-bg border-b border-border-color px-6 py-4 flex justify-between items-center z-10 shrink-0">
        <div className="min-w-0 flex-1 mr-4">
          <h1 className="text-xl font-bold flex items-center gap-2 text-text-main leading-none">
            <Video className="text-text-main shrink-0" size={24} />
            <span className="truncate" title={meeting?.title}>{meeting?.title}</span>
          </h1>
          <p className="text-[11px] text-text-muted font-mono mt-1.5 bg-primary-bg border border-border-color inline-block px-2.5 py-0.5 rounded-lg">
            Room Code: {meeting?.meetingCode}
          </p>
        </div>

        {/* Action tray */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Transcribing loader */}
          {isTranscribing && (
            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-500 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500"></div>
              <span>AI Processing...</span>
            </div>
          )}

          {/* Recording Timer Indicator */}
          {isRecording && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <Radio size={14} className="text-red-500 shrink-0" />
              <span>REC {formatDuration(recDuration)}</span>
            </div>
          )}
          
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            {peers.length + 1} Connected
          </div>
        </div>
      </header>

      {/* Main Workspace: Video Grid + Side Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Videos Area */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full flex items-center justify-center">
          <div className={`grid gap-3 sm:gap-6 w-full ${
            peers.length === 0 ? 'max-w-3xl grid-cols-1' :
            peers.length === 1 ? 'grid-cols-2 md:grid-cols-2 max-w-5xl' :
            peers.length === 2 ? 'grid-cols-2 md:grid-cols-3 max-w-6xl' :
            'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {/* Local Video Tile */}
            <div className="relative bg-secondary-bg rounded-3xl overflow-hidden border border-border-color shadow-2xl flex items-center justify-center group aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`}
              ></video>
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center text-4xl text-zinc-500 font-extrabold shadow-inner">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-glass-bg border border-border-color px-3 py-1.5 rounded-lg backdrop-blur-md text-xs font-semibold text-text-main shadow flex items-center gap-1.5">
                <span>You</span>
                {isScreenSharing && <span className="bg-zinc-800 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Sharing</span>}
                {!audioEnabled && <MicOff size={14} className="text-red-500" />}
              </div>
            </div>

            {/* Remote Peer Video Tiles */}
            {peers.map((peer) => (
              <RemoteVideoTile key={peer.socketId} peer={peer} />
            ))}
          </div>
        </div>

        {/* SIDE BAR PANELS (Chat / Participants) */}
        {activePanel && (
          <aside className="absolute sm:static inset-y-0 right-0 w-full sm:w-80 bg-secondary-bg border-l border-border-color flex flex-col z-20 shrink-0 shadow-2xl sm:shadow-none animate-fade-in-up">
            
            {/* Panel Header */}
            <div className="p-4 border-b border-border-color flex justify-between items-center bg-primary-bg">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-main flex items-center gap-2">
                {activePanel === 'chat' && (
                  <>
                    <MessageSquare size={16} />
                    <span>Room Chat</span>
                  </>
                )}
                {activePanel === 'participants' && (
                  <>
                    <Users size={16} />
                    <span>Participants ({peers.length + 1})</span>
                  </>
                )}
              </h3>
              <button 
                onClick={() => setActivePanel(null)}
                className="p-1 hover:bg-border-color rounded-full text-text-muted hover:text-text-main bg-transparent border-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel Content: CHAT */}
            {activePanel === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Message list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
                  {/* (Flex-col-reverse and slice/reverse lets scroll stay at bottom) */}
                  <div className="space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-10">
                        <MessageSquare size={36} className="mx-auto text-text-muted opacity-40 mb-2" />
                        <p className="text-xs text-text-muted">No messages yet. Send a chat to begin!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.senderId === (user?.id || user?._id);
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold text-text-muted">{isMe ? 'You' : msg.senderName}</span>
                              <span className="text-[8px] text-text-muted">{msg.timestamp}</span>
                            </div>
                            <div className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${
                              isMe 
                                ? 'bg-text-main text-secondary-bg rounded-tr-none' 
                                : 'bg-primary-bg text-text-main rounded-tl-none border border-border-color'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Typing Banner & Form */}
                <div className="p-3 border-t border-border-color space-y-2 bg-primary-bg">
                  {/* Typing Indicator list */}
                  {typingList.length > 0 && (
                    <div className="text-[10px] text-text-muted italic font-semibold px-1 animate-pulse">
                      {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}

                  <form onSubmit={handleSendChat} className="flex gap-2 items-stretch">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleChatKeyPress}
                      className="flex-1 bg-secondary-bg border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-text-main"
                      style={{ minHeight: '38px' }}
                    />
                    <button
                      type="submit"
                      className="w-[38px] h-[38px] flex items-center justify-center p-0 shrink-0 rounded-xl bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 hover:-translate-y-px transition-all cursor-pointer border-none"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Panel Content: PARTICIPANTS LIST */}
            {activePanel === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Local Participant */}
                <div className="p-3 bg-primary-bg border border-border-color rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-bg border border-border-color flex items-center justify-center font-bold text-xs">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-main">{user?.name} (You)</p>
                      <p className="text-[9px] text-text-muted">Organizer</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-text-muted">
                    {audioEnabled ? <Mic size={14} /> : <MicOff size={14} className="text-red-500" />}
                    {videoEnabled ? <Video size={14} /> : <VideoOff size={14} className="text-red-500" />}
                  </div>
                </div>

                {/* Remote Participants */}
                {peers.map((peer) => (
                  <div key={peer.socketId} className="p-3 bg-primary-bg border border-border-color rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {peer.userAvatar ? (
                        <img src={peer.userAvatar} alt={peer.userName} className="w-8 h-8 rounded-full object-cover border border-border-color" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary-bg border border-border-color flex items-center justify-center font-bold text-xs">
                          {peer.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-text-main truncate max-w-[120px]">{peer.userName}</p>
                        <p className="text-[9px] text-text-muted">Participant</p>
                      </div>
                    </div>
                    <div className="flex gap-2 text-text-muted">
                      {peer.audioEnabled ? <Mic size={14} /> : <MicOff size={14} className="text-red-500" />}
                      {peer.videoEnabled ? <Video size={14} /> : <VideoOff size={14} className="text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Control Buttons Bar */}
      <footer className="bg-secondary-bg border-t border-border-color p-3 sm:p-5 flex flex-wrap justify-center sm:justify-between items-center gap-4 z-10 shrink-0">
        
        {/* Left Actions */}
        <div className="flex items-center gap-2.5">
          {/* Audio toggle */}
          <button
            onClick={handleToggleAudio}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center ${
              audioEnabled 
              ? 'bg-primary-bg border-border-color text-text-main hover:bg-border-color'
              : 'bg-red-500 border-red-400 text-white shadow-red-500/10 hover:bg-red-600'
            }`}
            title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
            style={{ minHeight: '46px', minWidth: '46px' }}
          >
            {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Video toggle */}
          <button
            onClick={handleToggleVideo}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center ${
              videoEnabled 
              ? 'bg-primary-bg border-border-color text-text-main hover:bg-border-color'
              : 'bg-red-500 border-red-400 text-white shadow-red-500/10 hover:bg-red-600'
            }`}
            title={videoEnabled ? "Turn Camera Off" : "Turn Camera On"}
            style={{ minHeight: '46px', minWidth: '46px' }}
          >
            {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          {/* Screen Share toggle */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center ${
              isScreenSharing 
              ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
              : 'bg-primary-bg border-border-color text-text-main hover:bg-border-color'
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            style={{ minHeight: '46px', minWidth: '46px' }}
          >
            <Tv size={18} />
          </button>

          {/* Meeting recorder toggle */}
          <button
            onClick={handleToggleRecording}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center ${
              isRecording 
              ? 'bg-red-500 border-red-400 text-white hover:bg-red-600 animate-pulse'
              : 'bg-primary-bg border-border-color text-text-main hover:bg-border-color'
            }`}
            title={isRecording ? "Stop Recording Call" : "Record Call"}
            style={{ minHeight: '46px', minWidth: '46px' }}
          >
            <Radio size={18} />
          </button>
        </div>

        {/* Center: Leave button */}
        <div>
          <button
            onClick={handleLeaveMeeting}
            className="px-6 py-3.5 bg-red-600 border border-red-500 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2"
            style={{ minHeight: '46px' }}
          >
            <PhoneOff size={16} />
            <span>Leave Room</span>
          </button>
        </div>

        {/* Right Actions: Panel toggles */}
        <div className="flex items-center gap-2.5">
          {/* Chat Panel Toggle */}
          <button
            onClick={() => handleTogglePanel('chat')}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center ${
              activePanel === 'chat' 
              ? 'bg-text-main border-text-main text-secondary-bg'
              : 'bg-primary-bg border-border-color text-text-main hover:bg-border-color'
            }`}
            title="Chat Panel"
            style={{ minHeight: '46px', minWidth: '46px' }}
          >
            <MessageSquare size={18} />
          </button>

          {/* Participants Panel Toggle */}
          <button
            onClick={() => handleTogglePanel('participants')}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center ${
              activePanel === 'participants' 
              ? 'bg-text-main border-text-main text-secondary-bg'
              : 'bg-primary-bg border-border-color text-text-main hover:bg-border-color'
            }`}
            title="Participants List"
            style={{ minHeight: '46px', minWidth: '46px' }}
          >
            <Users size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MeetingRoom;


