// In-memory store for active meeting participants
// Format: socketId -> { userId, userName, userAvatar, roomId, audioEnabled, videoEnabled }
const activeParticipants = new Map();

/**
 * Handle Socket.io connections and events
 * @param {Server} io 
 */
export const handleSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected via socket: ${socket.id}`);

    // Join a meeting room
    socket.on('join-room', ({ roomId, userId, userName, userAvatar, audioEnabled = true, videoEnabled = true }) => {
      socket.join(roomId);
      
      const participantInfo = {
        socketId: socket.id,
        userId,
        userName: userName || 'Anonymous',
        userAvatar: userAvatar || '',
        roomId,
        audioEnabled,
        videoEnabled
      };

      activeParticipants.set(socket.id, participantInfo);
      
      console.log(`User ${userName} (${userId}) joined room ${roomId} (Socket: ${socket.id})`);

      // 1. Get all other participants in the same room
      const otherUsers = [];
      activeParticipants.forEach((user, sid) => {
        if (user.roomId === roomId && sid !== socket.id) {
          otherUsers.push(user);
        }
      });

      // 2. Send the existing users list to the joining user
      socket.emit('room-users', otherUsers);

      // 3. Broadcast to other users in the room that a new user joined
      socket.to(roomId).emit('user-joined', participantInfo);
    });

    // WebRTC Signaling: relay SDP Offer to specific peer
    socket.on('signal-offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('signal-offer', {
        senderSocketId: socket.id,
        offer
      });
    });

    // WebRTC Signaling: relay SDP Answer to specific peer
    socket.on('signal-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('signal-answer', {
        senderSocketId: socket.id,
        answer
      });
    });

    // WebRTC Signaling: relay ICE Candidate to specific peer
    socket.on('signal-ice', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('signal-ice', {
        senderSocketId: socket.id,
        candidate
      });
    });

    // Real-time Chat: broadcast message to room
    socket.on('send-chat-message', ({ roomId, messageText, senderName, senderId }) => {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      io.to(roomId).emit('chat-message', {
        id: `${socket.id}-${Date.now()}`,
        senderId,
        senderName: senderName || 'Anonymous',
        text: messageText,
        timestamp
      });
    });

    // Chat Typing Indicator
    socket.on('user-typing', ({ roomId, isTyping, userName }) => {
      socket.to(roomId).emit('user-typing', {
        socketId: socket.id,
        userName,
        isTyping
      });
    });

    // Device status toggle: Audio (mute/unmute)
    socket.on('toggle-audio', ({ roomId, enabled }) => {
      const user = activeParticipants.get(socket.id);
      if (user) {
        user.audioEnabled = enabled;
        socket.to(roomId).emit('user-device-status', {
          socketId: socket.id,
          type: 'audio',
          enabled
        });
      }
    });

    // Device status toggle: Video (cam on/off)
    socket.on('toggle-video', ({ roomId, enabled }) => {
      const user = activeParticipants.get(socket.id);
      if (user) {
        user.videoEnabled = enabled;
        socket.to(roomId).emit('user-device-status', {
          socketId: socket.id,
          type: 'video',
          enabled
        });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const user = activeParticipants.get(socket.id);
      if (user) {
        const { roomId, userName } = user;
        console.log(`User ${userName} disconnected from room ${roomId} (Socket: ${socket.id})`);
        
        // Remove from store
        activeParticipants.delete(socket.id);

        // Notify other room members
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userId: user.userId
        });
      }
    });
  });
};

export default {
  handleSocket
};
