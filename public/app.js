// --- 1. DEEP DSA: WEIGHTED DIRECTED GRAPH (Adjacency List) ---
class TimelineGraph {
    constructor() {
        this.adjacencyList = new Map();
    }

    // Add a node (timestamp segment)
    addNode(nodeId, startTime, endTime) {
        if (!this.adjacencyList.has(nodeId)) {
            this.adjacencyList.set(nodeId, {
                startTime: startTime,
                endTime: endTime,
                edges: [] // Choices
            });
        }
    }

    // Add a choice (directed edge with a "weight" of how many times it's been watched)
    addEdge(sourceNode, targetNode, choiceText, weight = 1) {
        if (this.adjacencyList.has(sourceNode)) {
            this.adjacencyList.get(sourceNode).edges.push({
                target: targetNode,
                text: choiceText,
                weight: weight
            });
        }
    }

    // Get node data
    getNode(nodeId) {
        return this.adjacencyList.get(nodeId);
    }
}

// Initialize the Graph
const videoGraph = new TimelineGraph();

// Build the "Echo Chamber" Map
// Node 1: 0s to 10s (Start)
videoGraph.addNode("start", 0, 10);
videoGraph.addEdge("start", "dark_room", "Enter the Dark Room");
videoGraph.addEdge("start", "run_away", "Run Away");

// Node 2: 20s to 40s (Dark Room)
videoGraph.addNode("dark_room", 20, 40);
videoGraph.addEdge("dark_room", "ending_a", "Hide under bed");
videoGraph.addEdge("dark_room", "ending_b", "Look out window");

// Node 3: 45s to 60s (Run Away)
videoGraph.addNode("run_away", 45, 60);
videoGraph.addEdge("run_away", "ending_b", "Call police");
videoGraph.addEdge("run_away", "ending_a", "Keep running");

// Endings loop back to start to break the algorithm
videoGraph.addNode("ending_a", 65, 75);
videoGraph.addEdge("ending_a", "start", "Restart Loop");

videoGraph.addNode("ending_b", 80, 90);
videoGraph.addEdge("ending_b", "start", "Restart Loop");


// --- 2. OS: STATE MANAGEMENT & EVENT LOOP ---
let player;
let currentNodeId = "start"; 
let isWaitingForChoice = false;
let timeCheckInterval; 

// YouTube API calls this when ready
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        height: '100%', 
        width: '100%',
        videoId: 'dQw4w9WgXcQ', // Replace with any long video ID
        playerVars: { 'controls': 0, 'disablekb': 1, 'rel': 0, 'modestbranding': 1 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
    startTimeMonitor();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        jumpToNode("start", 0);
    }
}

// --- 3. THE ALGORITHM BREAKER (Time Monitoring) ---
function startTimeMonitor() {
    // OS Process Scheduling simulation: Checking every 250ms
    timeCheckInterval = setInterval(() => {
        if (!isWaitingForChoice && player && player.getCurrentTime) {
            let currentTime = player.getCurrentTime();
            let nodeData = videoGraph.getNode(currentNodeId);

            // If the video reaches the end of the current node's segment
            if (currentTime >= nodeData.endTime) {
                triggerChoice(nodeData);
            }
        }
    }, 250);
}

// --- 4. UI & GRAPH TRAVERSAL ---
function triggerChoice(nodeData) {
    isWaitingForChoice = true;
    player.pauseVideo(); 

    const overlay = document.getElementById('choice-overlay');
    const btn1 = document.getElementById('btn-1');
    const btn2 = document.getElementById('btn-2');
    
    // Graph Traversal: Get the edges (choices) for this node
    const choices = nodeData.edges;

    btn1.innerText = choices[0] ? choices[0].text : "";
    btn2.innerText = choices[1] ? choices[1].text : "";
    
    if (choices[0]) {
        btn1.style.display = "block";
        btn1.onclick = () => handleChoice(choices[0].target);
    } else { btn1.style.display = "none"; }

    if (choices[1]) {
        btn2.style.display = "block";
        btn2.onclick = () => handleChoice(choices[1].target);
    } else { btn2.style.display = "none"; }

    overlay.classList.remove('hidden'); 
}

function handleChoice(nextNodeId) {
    document.getElementById('choice-overlay').classList.add('hidden');
    isWaitingForChoice = false;
    
    // Use Hash Map (O(1)) to get the exact start time of the new node
    const nextNodeData = videoGraph.getNode(nextNodeId);
    jumpToNode(nextNodeId, nextNodeData.startTime);
}

function jumpToNode(nodeId, startTime) {
    currentNodeId = nodeId;
    player.seekTo(startTime, true); // The Algorithm Breaker
    player.playVideo();
}