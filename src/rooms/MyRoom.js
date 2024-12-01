const colyseus = require('colyseus');
const { MyRoomState, PlayerSchema, AcronimoSchema } = require('./schema/MyRoomState');

const sigle = [
    "AIDS", "HIV", "USA", "USSR", "ONU", "NASA",
    "FBI", "UNICEF", "NATO", "URL", "PDF",
    "HTML", "VIP", "ASAP", "LOL"
];

const parolegiocatori =[]

const acronimi = [
    "AIDS", "HIV", "USA", "USSR", "ONU", "NASA",
    "FBI", "UNICEF", "NATO", "URL", "PDF",
    "HTML", "VIP", "ASAP", "LOL"
];

var acronimi_mandati = [];

exports.MyRoom = class extends colyseus.Room {
    maxClients = 16;

    onCreate(options) {
        this.setState(new MyRoomState());
        this.reconnectionTimeouts = new Map();
        this.playerIdentities = new Map();
        this.usedNicknames = new Set();
        this.state.currentRound = 0;
        this.gameStarted = false;  // Add this flag

        // Set maximum clients and ensure room stays unlocked
        this.maxClients = 16;
        this.setMetadata({ maxClients: 16 });
        this.autoDispose = false;
        this.unlock(); // Start with an unlocked room

        this.onMessage("start_game", (client, message) => {
            this.gameStarted = true;
            this.state.currentRound = 1;
            this.hostSessionId = client.sessionId;
            this.state.totalRounds = message.totalRounds || 3;
            this.state.timerDuration = message.timerDuration || 60;
            
            // Set total rounds from message
            this.state.totalRounds = message.totalRounds || 3;
            
            // Use custom words if specified
            if (message.useCustomWords) {
                this.useCustomWords = true; // Flag to track custom words mode
                this.broadcast("custom_words_phase");
            } else {
                // Start game immediately with default words
                this.broadcast("round_started", {
                    roundNumber: this.state.currentRound,
                    totalRounds: this.state.totalRounds,
                    letter: this.state.currentLetter,
                    timerDuration: this.state.timerDuration
                });
            }
        
            // Broadcast game start with timer duration
            this.broadcast("round_started", {
                roundNumber: this.state.currentRound,
                totalRounds: this.state.totalRounds,
                letter: this.state.currentLetter,
                timerDuration: this.state.timerDuration
            });
        });

        this.onMessage("return_all_to_lobby", (client) => {
            // Verifica che il messaggio provenga dall'host
            if (client.sessionId === this.hostSessionId) {
                // Invia tutti alla home
                this.broadcast("force_return_to_lobby");
            }
        });

        this.onMessage("start_custom_words_phase", (client) => {
            this.broadcast("custom_words_phase");
        });

        this.onMessage("submit_custom_word", (client, message) => {
            // Get the player using MapSchema's get method
            const player = this.state.players.get(client.sessionId);
            
            if (!player || player.hasSubmittedWords) {
                return; // Exit if player doesn't exist or has already submitted
            }
            
            // Add word to array if it's not already there
            if (message.word && !parolegiocatori.includes(message.word)) {
                parolegiocatori.push(message.word);
                console.log("Word added:", message.word);
            }
        
            // Mark player as having submitted
            player.hasSubmittedWords = true;
            this.state.wordsSubmittedCount++;
        
            // Broadcast progress update
            this.broadcast("words_submission_update", {
                submittedCount: this.state.wordsSubmittedCount,
                totalPlayers: this.clients.length-1
            });
        
            // Check if all players have submitted
            if (this.state.wordsSubmittedCount >= this.clients.length-1) {
                this.state.wordsSubmittedCount = 0;
                this.state.players.forEach((p) => {
                    if (p instanceof PlayerSchema) {
                        p.hasSubmittedWords = false;
                    }
                });
        
                this.gameStarted = true;
                this.state.currentRound++;
                
                const randomWord = parolegiocatori[Math.floor(Math.random() * parolegiocatori.length)];
                this.state.currentLetter = randomWord;
                
                this.broadcast("all_words_submitted");
                // Add timerDuration to the round_started message
                this.broadcast("round_started", {
                    roundNumber: this.state.currentRound,
                    totalRounds: this.state.totalRounds,
                    letter: this.state.currentLetter,
                    timerDuration: this.state.timerDuration // Use stored duration
                });
            }
        });

// src/rooms/MyRoom.js

this.onMessage("start_new_round", (client, message) => {
    if (!this.gameStarted) return;

    this.state.currentRound++;
    this.state.timerDuration = message.timerDuration || 60;


    if (this.state.currentRound > this.state.totalRounds) {
        this.gameStarted = false;
        this.state.currentRound = 0;
        this.state.players.forEach(player => {
            player.score = 0;
        });
        this.broadcast("return_to_lobby");
        return;
    }

    // Reset dello stato del gioco per il nuovo round
    this.state.acronimiMandati = [];
    
    // Imposta la lettera corrente
    if (parolegiocatori.length > 0) {
        const randomWord = parolegiocatori[Math.floor(Math.random() * parolegiocatori.length)];
        this.state.currentLetter = randomWord;
    } else {
        const randomAcronimo = acronimi[Math.floor(Math.random() * acronimi.length)];
        this.state.currentLetter = randomAcronimo.charAt(0);
    }
    
    // Invia il messaggio round_started con timerDuration
    this.broadcast("round_started", {
        roundNumber: this.state.currentRound,
        totalRounds: this.state.totalRounds,
        letter: this.state.currentLetter,
        timerDuration: this.state.timerDuration
    });
});

// src/rooms/MyRoom.js

this.onMessage("start_round", (client, message) => {
    if (!this.gameStarted) return;

    this.state.currentRound++;
    this.state.timerDuration = message.timerDuration || 60;

    if (this.state.currentRound > this.state.totalRounds) {
        this.gameStarted = false;
        this.state.currentRound = 0;
        this.state.players.forEach(player => {
            player.score = 0;
        });
        this.broadcast("return_to_lobby");
        return;
    }

    // Reset dello stato del gioco per il nuovo round
    this.state.acronimiMandati = [];

    // Imposta la lettera corrente
    if (parolegiocatori.length > 0) {
        const randomWord = parolegiocatori[Math.floor(Math.random() * parolegiocatori.length)];
        this.state.currentLetter = randomWord;
    } else {
        const randomAcronimo = acronimi[Math.floor(Math.random() * acronimi.length)];
        this.state.currentLetter = randomAcronimo.charAt(0);
    }

    // Broadcast del nuovo round
    this.broadcast("round_started", {
        roundNumber: this.state.currentRound,
        totalRounds: this.state.totalRounds,
        letter: this.state.currentLetter,
        timerDuration: this.state.timerDuration
    });
});
    

        // Message handlers
        this.onMessage("end_round", (client) => {
            console.log("Broadcasting end_round message from client:", client.sessionId);
            this.broadcast("end_round");
        });

        this.onMessage("show_scores", (client) => {
            console.log("Showing scores");
            this.broadcast("show_scores");
            Object.entries(this.state.players).forEach(([sessionId, player]) => {
                console.log(`Player ${player.nickname}: ${player.score} points`);
            });
        });
    
        this.onMessage("next_acronimo", (client, message) => {
            console.log("Received next_acronimo message");
            this.broadcast("next_acronimo", { 
                index: message.index,
                text: this.state.acronimiMandati[message.index].text,
                upvotes: this.state.acronimiMandati[message.index].upvotes,
                downvotes: this.state.acronimiMandati[message.index].downvotes,
                author: this.state.acronimiMandati[message.index].author // Aggiungi l'autore
            });
        });
    
        this.onMessage("vote", (client, message) => {
            const { index, isUpvote } = message;
            const acronimo = this.state.acronimiMandati[index];
            if (acronimo && acronimo.author) {
                // Find the player who authored the acronimo
                const authorSessionId = this.getSessionIdByNickname(acronimo.author);
                if (authorSessionId && this.state.players[authorSessionId]) {
                    if (isUpvote) {
                        acronimo.upvotes++;
                        this.state.players[authorSessionId].score++;
                    } else {
                        acronimo.downvotes++;
                        this.state.players[authorSessionId].score--;
                    }
                }

                const authorPlayer = Array.from(this.state.players.entries())
                    .find(([_, player]) => player.nickname === acronimo.author)?.[1];
                    
                if (!authorPlayer) {
                    console.error(`Could not find player with nickname ${acronimo.author}`);
                    return;
                }
        
                if (isUpvote) {
                    acronimo.upvotes++;
                    authorPlayer.score++;
                    console.log(`Punto assegnato a ${authorPlayer.nickname}, nuovo punteggio: ${authorPlayer.score}`);
                } else {
                    acronimo.downvotes++;
                    authorPlayer.score--;
                    console.log(`Punto sottratto a ${authorPlayer.nickname}, nuovo punteggio: ${authorPlayer.score}`);
                }
        
                // Broadcast vote update with author score
                this.broadcast("vote_update", { 
                    index, 
                    upvotes: acronimo.upvotes, 
                    downvotes: acronimo.downvotes,
                    author: acronimo.author,
                    authorScore: authorPlayer.score
                });
            }
        });
    
        this.onMessage("manda_acronimo", (client, message) => {
            const acronimo = new AcronimoSchema();
            acronimo.text = message.acronimo;
            acronimo.author = this.state.players[client.sessionId].nickname; // Assicurati che questo sia impostato
            acronimo.upvotes = 0;
            acronimo.downvotes = 0;
            this.state.acronimiMandati.push(acronimo);
            console.log("Acronimo ricevuto:", message.acronimo, "da:", acronimo.author); // Log per debug
        });
    
        // Generate a random letter at the start of the round
        this.state.currentLetter = acronimi[Math.floor(Math.random() * acronimi.length)];
        console.log(`Generated letter: ${this.state.currentLetter}`);
    }

    onJoin(client, options) {
        console.log(`${client.sessionId} joined room ${this.roomId}`);
        console.log(`Received nickname: ${options.nickname}`);
        

        // First check if nickname is provided
        if (!options.nickname) {
            throw new Error("Nickname is required");
        }

        // Check for existing nickname
        if (this.usedNicknames.has(options.nickname)) {
            console.log(`Nickname ${options.nickname} is already in use. Reconnecting...`);
            // If nickname exists, handle reconnection
            const existingSessionId = this.getSessionIdByNickname(options.nickname);
            if (existingSessionId) {
                // Remove old player entry
                delete this.state.players[existingSessionId];
                this.usedNicknames.delete(options.nickname);
                this.playerIdentities.delete(existingSessionId);
                console.log(`Removed previous sessionId ${existingSessionId} for nickname ${options.nickname}`);
            }
        }

        // Store player identity and nickname
        this.playerIdentities.set(client.sessionId, options.nickname);
        this.usedNicknames.add(options.nickname);
        console.log(`Added nickname ${options.nickname} for sessionId ${client.sessionId}`);

        // Create new player
        const player = new PlayerSchema();
        player.nickname = options.nickname;
        player.score = 0;
        player.connected = true;
        this.state.players[client.sessionId] = player;
        console.log(`Player ${player.nickname} added to players state.`);

        // Update connected players count
        const connectedPlayers = Object.values(this.state.players)
            .filter(p => p.connected).length;

        console.log(`Connected players count: ${connectedPlayers}`);

        // Update room lock status
        if (connectedPlayers >= this.maxClients) {
            this.lock();
            console.log(`Room ${this.roomId} locked.`);
        } else {
            this.unlock();
            console.log(`Room ${this.roomId} unlocked.`);
        }
    }

    getSessionIdByNickname(nickname) {
        for (const [sessionId, playerNickname] of this.playerIdentities) {
            if (playerNickname === nickname) {
                return sessionId;
            }
        }
        return null;
    }


    async onLeave(client, consented) {
        console.log(`${client.sessionId} attempting to leave room ${this.roomId} (consented: ${consented})`);

        if (consented) {
            // If leaving consensually, clean up completely
            const nickname = this.playerIdentities.get(client.sessionId);
            this.usedNicknames.delete(nickname);
            this.playerIdentities.delete(client.sessionId);
            delete this.state.players[client.sessionId];
            console.log(`Player ${nickname} left the room.`);
        } else {
            // If disconnected, just mark as offline
            if (this.state.players[client.sessionId]) {
                this.state.players[client.sessionId].connected = false;
                console.log(`Player ${this.state.players[client.sessionId].nickname} marked as offline.`);
            } else {
                console.log(`Player with sessionId ${client.sessionId} not found in players state.`);
            }
        }

        try {
            // Clear any existing reconnection timeout
            if (this.reconnectionTimeouts.has(client.sessionId)) {
                clearTimeout(this.reconnectionTimeouts.get(client.sessionId));
                this.reconnectionTimeouts.delete(client.sessionId);
                console.log(`Cleared reconnection timeout for sessionId ${client.sessionId}`);
            }

            if (!consented) {
                console.log(`${client.sessionId} disconnected, waiting for reconnection...`);
                if (this.state.players[client.sessionId]) {
                    this.state.players[client.sessionId].connected = false;

                    // Set up reconnection timeout
                    const timeout = setTimeout(() => {
                        console.log(`${client.sessionId} reconnection timeout expired`);
                        if (this.state.players[client.sessionId]) {
                            this.state.players[client.sessionId].connected = false;
                        }
                    }, 120000); // 120 seconds timeout

                    this.reconnectionTimeouts.set(client.sessionId, timeout);
                }
            }

            // Correctly count connected players after a player leaves
            const connectedPlayers = Object.values(this.state.players)
                .filter(p => p.connected).length;
            if (connectedPlayers < this.maxClients) {
                this.unlock();
                console.log(`Room ${this.roomId} unlocked after player left. Connected players: ${connectedPlayers}`);
            }
        } catch (error) {
            console.error(`Error handling leave for ${client.sessionId}:`, error);
            if (this.state.players[client.sessionId]) {
                this.state.players[client.sessionId].connected = false;
            }
        }
    }

    onDispose() {
        console.log(`Room ${this.roomId} disposed.`);
    }
}