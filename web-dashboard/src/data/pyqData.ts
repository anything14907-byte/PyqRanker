import { SubjectMeta, PYQQuestion } from '../types';
import { STANDARD_CS_SUBJECTS, STANDARD_CS_PYQS } from './standardSyllabus';

const nowTime = Date.now();
const defaultDate = (days: number, hours: number) => {
  const d = new Date(nowTime + (days * 24 + hours) * 3600 * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const INITIAL_SUBJECTS: SubjectMeta[] = STANDARD_CS_SUBJECTS;

export const INITIAL_QUESTIONS: PYQQuestion[] = [
  ...STANDARD_CS_PYQS,
  // ==========================================
  // OPERATING SYSTEMS
  // ==========================================
  {
    id: 'OS-01',
    subjectId: 'os',
    subjectName: 'Operating Systems',
    unit: 2,
    unitTitle: 'Synchronization & Deadlocks',
    question: "Explain the Banker's Algorithm for Deadlock Avoidance. State the safety algorithm and write the data structures required (Available, Max, Allocation, Need).",
    marks: 10,
    yearsAsked: [2021, 2022, 2023, 2024, 2025],
    repeatCount: 5,
    isHighProbability: true,
    expectedKeywords: ["Bankers Algorithm", "Safe State", "Available Vector", "Max Matrix", "Allocation Matrix", "Need Matrix", "Deadlock Avoidance"],
    bullets: [
      "Banker's Algorithm tests for safety before allocating resources to ensure the system never enters an unsafe deadlock state.",
      "Uses 4 core data structures: Available[m] (free resources), Max[n][m] (max demand), Allocation[n][m] (current hold), and Need[n][m].",
      "Calculates current remaining need using the exact formula: Need[i][j] = Max[i][j] - Allocation[i][j].",
      "Safety Algorithm iterates through all processes, releasing held resources back into Work vector once a process can complete safely."
    ],
    diagramFormulaTip: "Draw the Resource Matrix Table showing columns: Process | Allocation | Max | Available | Need. Write the equation Need = Max - Allocation.",
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'OS-02',
    subjectId: 'os',
    subjectName: 'Operating Systems',
    unit: 1,
    unitTitle: 'Process Scheduling',
    question: "Compare Preemptive and Non-Preemptive CPU Scheduling. Calculate Average Waiting Time and Turnaround Time for FCFS, SJF, and Round Robin.",
    marks: 10,
    yearsAsked: [2021, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["Turnaround Time", "Waiting Time", "Gantt Chart", "Time Quantum", "Round Robin", "SJF", "Preemption"],
    bullets: [
      "Preemptive scheduling allows the OS to interrupt a running process when higher-priority work arrives; Non-preemptive runs until process completion or voluntary yield.",
      "Round Robin enforces equal time slices (Time Quantum) preventing CPU monopolization and starving long jobs.",
      "Shortest Job First (SJF) gives optimal minimum average waiting time but can suffer from starvation of long processes.",
      "Key Exam Formulas: Turnaround Time = Completion Time - Arrival Time; Waiting Time = Turnaround Time - Burst Time."
    ],
    diagramFormulaTip: "Draw a horizontal Gantt Chart timeline showing timeline intervals (0, 2, 5, 8...) and build a final calculation table with TAT and WT columns.",
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'OS-03',
    subjectId: 'os',
    subjectName: 'Operating Systems',
    unit: 3,
    unitTitle: 'Memory & Paging',
    question: "What is Paging? Describe the Translation Lookaside Buffer (TLB) and derive the formula for Effective Memory Access Time (EMAT).",
    marks: 10,
    yearsAsked: [2022, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["TLB", "Page Table", "Effective Memory Access Time", "Hit Ratio", "Frame Number", "Page Number", "Paging"],
    bullets: [
      "Paging eliminates external fragmentation by mapping fixed-size logical pages to physical memory frames non-contiguously.",
      "The TLB is a high-speed associative hardware cache storing recent page-to-frame translations to avoid multiple slow RAM lookups.",
      "On TLB hit (ratio h), memory access requires: t_tlb + t_mem.",
      "On TLB miss (ratio 1-h), memory access requires: t_tlb + 2 * t_mem (one for page table, one for data).",
      "Final EMAT Formula: EMAT = h * (t_tlb + t_mem) + (1 - h) * (t_tlb + 2 * t_mem)."
    ],
    diagramFormulaTip: "Draw the CPU Logical Address split into Page (p) and Offset (d), pointing first to the TLB box and fallback to the Main Memory Page Table.",
    userStatus: 'not-started'
  },
  {
    id: 'OS-04',
    subjectId: 'os',
    subjectName: 'Operating Systems',
    unit: 2,
    unitTitle: 'Synchronization & Deadlocks',
    question: "Explain Counting vs Binary Semaphores. How do Wait() and Signal() primitives ensure Mutual Exclusion in Critical Sections?",
    marks: 5,
    yearsAsked: [2021, 2022, 2024],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ["Semaphore", "Wait Primitive", "Signal Primitive", "Mutual Exclusion", "Critical Section", "Binary Semaphore", "Counting Semaphore"],
    bullets: [
      "A semaphore is an atomic synchronization variable modified only by wait() [P] and signal() [V] operations.",
      "Binary Semaphore takes values 0 or 1, serving as a Mutex Lock to guarantee mutual exclusion in the critical section.",
      "Counting Semaphore takes non-negative values to control access to a finite pool of identical resource instances.",
      "wait(S) decrements S; if S <= 0, the calling process blocks. signal(S) increments S and unblocks waiting processes."
    ],
    diagramFormulaTip: "Write the 3-line atomic pseudocode for wait(S) { while(S<=0); S--; } and signal(S) { S++; }.",
    userStatus: 'not-started'
  },
  {
    id: 'OS-05',
    subjectId: 'os',
    subjectName: 'Operating Systems',
    unit: 3,
    unitTitle: 'Memory & Paging',
    question: "Explain Belady's Anomaly in page replacement algorithms with a reference string example. Why is LRU immune to it?",
    marks: 5,
    yearsAsked: [2021, 2023, 2025],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ["Beladys Anomaly", "FIFO", "Page Faults", "Stack Algorithm", "LRU", "Frame Allocation"],
    bullets: [
      "Belady's Anomaly is the counter-intuitive phenomenon where increasing physical frame allocation causes MORE page faults under FIFO.",
      "Common reference string counterexample: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 (causes 9 faults with 3 frames, but 10 faults with 4 frames).",
      "LRU and Optimal algorithms are provably immune because they belong to the class of 'Stack Algorithms'.",
      "In stack algorithms, the page set in n frames is always a strict subset of the page set in (n+1) frames."
    ],
    diagramFormulaTip: "Draw a small grid tracing the 12-number string with 3 frame rows vs 4 frame rows showing the asterisk (*) page faults.",
    userStatus: 'not-started'
  },
  {
    id: 'OS-06',
    subjectId: 'os',
    subjectName: 'Operating Systems',
    unit: 4,
    unitTitle: 'Storage & Disk Management',
    question: "Compare SCAN and C-SCAN disk scheduling algorithms. Calculate total head movement given a cylinder request queue.",
    marks: 5,
    yearsAsked: [2022, 2024, 2025],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ["Disk Scheduling", "SCAN", "C-SCAN", "Head Movement", "Cylinder", "Elevator Algorithm"],
    bullets: [
      "SCAN (Elevator Algorithm) moves disk heads in one direction servicing all requests until the disk boundary, then reverses.",
      "C-SCAN (Circular SCAN) moves in one direction servicing requests, but upon reaching the end, jumps directly back to cylinder 0 without servicing on the return trip.",
      "C-SCAN provides more uniform waiting times for newly arriving requests at cylinder edges.",
      "Total Head Movement = Sum of absolute differences between consecutive cylinder stops: |pos_current - pos_next|."
    ],
    diagramFormulaTip: "Draw a horizontal cylinder axis (0 to 199) with zigzag line for SCAN vs unidirectional slope with dashed return line for C-SCAN.",
    userStatus: 'not-started'
  },
  {
    id: 'OS-07',
    subjectId: 'os',
    subjectName: 'Operating Systems',
    unit: 1,
    unitTitle: 'Process Scheduling',
    question: "What is a Process Control Block (PCB)? List any four essential attributes contained in it.",
    marks: 2,
    yearsAsked: [2021, 2022, 2023, 2024, 2025],
    repeatCount: 5,
    isHighProbability: true,
    expectedKeywords: ["Process Control Block", "PCB", "Program Counter", "Process State", "CPU Registers", "Memory Limits"],
    bullets: [
      "The PCB is the kernel data structure containing all administrative info required to manage and context-switch an active process.",
      "Field 1: Process ID (PID) & Current State (Ready, Running, Waiting, Terminated).",
      "Field 2: Program Counter (stores the address of the next instruction to execute).",
      "Field 3: CPU Registers (accumulators, index registers saved during context switch).",
      "Field 4: Memory Management Limits (base and limit registers or page table pointers)."
    ],
    diagramFormulaTip: "Draw a simple rectangular box divided into 5 labeled horizontal slots representing the PCB struct.",
    userStatus: 'not-started'
  },
  {
    id: 'OS-08',
    subjectId: 'os',
    subjectName: 'Operating Systems',
    unit: 2,
    unitTitle: 'Synchronization & Deadlocks',
    question: "State the four Coffman conditions necessary for a Deadlock to occur in an operating system.",
    marks: 2,
    yearsAsked: [2021, 2022, 2023, 2024],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Circular Wait", "Deadlock Conditions"],
    bullets: [
      "1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.",
      "2. Hold and Wait: A process holding at least one resource is actively waiting to acquire others held by different processes.",
      "3. No Preemption: Resources cannot be forcibly taken; they are released only voluntarily by the holding process.",
      "4. Circular Wait: A closed loop {P0 -> P1 -> ... -> Pn -> P0} exists where each process waits for a resource held by the next."
    ],
    diagramFormulaTip: "Draw a 4-node circular arrow loop showing Process 1 holding R1 waiting for R2 held by Process 2.",
    userStatus: 'not-started'
  },

  // ==========================================
  // DATABASE MANAGEMENT SYSTEMS
  // ==========================================
  {
    id: 'DBMS-01',
    subjectId: 'dbms',
    subjectName: 'Database Systems',
    unit: 2,
    unitTitle: 'SQL & Normalization',
    question: "Explain 1NF, 2NF, 3NF, and BCNF with Functional Dependencies. Demonstrate an example schema that satisfies 3NF but violates BCNF.",
    marks: 10,
    yearsAsked: [2021, 2022, 2023, 2024, 2025],
    repeatCount: 5,
    isHighProbability: true,
    expectedKeywords: ["Normalization", "1NF", "2NF", "3NF", "BCNF", "Functional Dependency", "Superkey", "Lossless Decomposition", "Candidate Key"],
    bullets: [
      "1NF requires all attribute values to be atomic (no multi-valued or nested repeating groups).",
      "2NF is in 1NF and contains no Partial Dependencies (every non-prime attribute must depend on the FULL candidate key).",
      "3NF is in 2NF and contains no Transitive Dependencies (for every X -> Y, either X is a superkey or Y is a prime attribute).",
      "BCNF enforces the strict rule: for every non-trivial FD X -> Y, X MUST be a Superkey.",
      "Classic 3NF vs BCNF violation: R(Student, Subject, Teacher) with FDs: {Student, Subject} -> Teacher and Teacher -> Subject. Here Teacher is not a superkey, violating BCNF while satisfying 3NF."
    ],
    diagramFormulaTip: "Write the formal containment diagram: BCNF ⊂ 3NF ⊂ 2NF ⊂ 1NF as concentric circles.",
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'DBMS-02',
    subjectId: 'dbms',
    subjectName: 'Database Systems',
    unit: 3,
    unitTitle: 'Transactions & Concurrency',
    question: "Explain ACID Properties and Conflict Serializability. How does a Precedence (Serialization) Graph detect conflicting schedules?",
    marks: 10,
    yearsAsked: [2021, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["ACID Properties", "Atomicity", "Consistency", "Isolation", "Durability", "Conflict Serializability", "Precedence Graph", "Conflict Equivalent"],
    bullets: [
      "ACID: Atomicity (all-or-nothing via WAL), Consistency (database constraints preserved), Isolation (concurrency control), Durability (committed changes persist).",
      "Two operations conflict if they belong to different transactions, access the exact same data item, and at least ONE operation is a WRITE.",
      "A schedule is Conflict Serializable if it can be transformed into a serial schedule by swapping non-conflicting consecutive operations.",
      "Precedence Graph: Nodes represent transactions; draw directed edge Ti -> Tj if Ti executes a conflicting operation before Tj.",
      "Theorem: A schedule is conflict serializable if and only if its Precedence Graph has NO directed cycles."
    ],
    diagramFormulaTip: "Draw a 2-node graph with T1 and T2 showing directed arrow T1 -> T2 and state that topological sort gives equivalent serial order.",
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'DBMS-03',
    subjectId: 'dbms',
    subjectName: 'Database Systems',
    unit: 4,
    unitTitle: 'Indexing & B+ Trees',
    question: "Describe B+ Tree index structures. Explain how node splitting works and why B+ Trees are superior to B-Trees for range queries.",
    marks: 10,
    yearsAsked: [2022, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["B+ Tree", "B-Tree", "Leaf Nodes", "Linked List", "Range Queries", "Node Splitting", "Internal Nodes", "Clustered Index"],
    bullets: [
      "In B+ Trees, all actual data records and pointers reside strictly in linked leaf nodes; internal nodes store only router/search keys.",
      "Leaves are doubly linked, enabling fast O(log N + k) sequential range scans without re-traversing the tree from root.",
      "High branching factor (fan-out) minimizes disk I/O depth, keeping tree height typically between 2 to 4 levels for millions of rows.",
      "When a node exceeds maximum capacity (m-1 keys), it splits into two halves, pushing the median key up to the parent."
    ],
    diagramFormulaTip: "Draw a 2-level B+ Tree showing internal key routing nodes and bottom leaf nodes connected with horizontal bi-directional arrows (↔).",
    userStatus: 'not-started'
  },
  {
    id: 'DBMS-04',
    subjectId: 'dbms',
    subjectName: 'Database Systems',
    unit: 3,
    unitTitle: 'Transactions & Concurrency',
    question: "Explain Two-Phase Locking (2PL). Contrast Growing Phase and Shrinking Phase. Does Basic 2PL prevent Deadlocks?",
    marks: 5,
    yearsAsked: [2021, 2022, 2024],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ["Two-Phase Locking", "2PL", "Growing Phase", "Shrinking Phase", "Lock Point", "Deadlock", "Cascading Rollback"],
    bullets: [
      "2PL Protocol Rule: A transaction may not acquire any new lock once it releases its first lock.",
      "Growing Phase: Locks are acquired and no locks are released; transaction reaches its 'Lock Point' at the peak.",
      "Shrinking Phase: Locks are released and no new locks can be acquired.",
      "2PL guarantees Conflict Serializability, but DOES NOT prevent deadlocks (transactions can still enter circular lock waits).",
      "Strict 2PL prevents cascading aborts by holding all exclusive locks until transaction commit/abort."
    ],
    diagramFormulaTip: "Draw a 2D line graph with X-axis (Time) and Y-axis (Number of Locks Held) forming a triangular peak at the Lock Point.",
    userStatus: 'not-started'
  },
  {
    id: 'DBMS-05',
    subjectId: 'dbms',
    subjectName: 'Database Systems',
    unit: 3,
    unitTitle: 'Transactions & Concurrency',
    question: "What is a Dirty Read anomaly in concurrent transactions? Which SQL isolation level prevents it?",
    marks: 2,
    yearsAsked: [2022, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["Dirty Read", "Uncommitted Data", "Rollback", "Read Committed", "Transaction Isolation"],
    bullets: [
      "A Dirty Read occurs when Transaction T1 reads data modified by concurrent Transaction T2, but T2 subsequently aborts and rolls back.",
      "T1 operates on phantom/invalid data that officially never existed in the permanent database log.",
      "Prevented by setting transaction isolation level to READ COMMITTED (or REPEATABLE READ / SERIALIZABLE)."
    ],
    diagramFormulaTip: "Write a 3-step timeline: T1 writes X=100 -> T2 reads X=100 -> T1 aborts/rolls back.",
    userStatus: 'not-started'
  },

  // ==========================================
  // COMPUTER NETWORKS
  // ==========================================
  {
    id: 'CN-01',
    subjectId: 'cn',
    subjectName: 'Computer Networks',
    unit: 4,
    unitTitle: 'Transport Layer & TCP',
    question: "Explain TCP Congestion Control mechanisms (Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery) with a cwnd graph.",
    marks: 10,
    yearsAsked: [2021, 2022, 2023, 2024, 2025],
    repeatCount: 5,
    isHighProbability: true,
    expectedKeywords: ["TCP Congestion Control", "Slow Start", "Congestion Avoidance", "Fast Retransmit", "Fast Recovery", "AIMD", "ssthresh", "cwnd"],
    bullets: [
      "TCP uses the Congestion Window (cwnd) to regulate transmission rate into the network based on packet loss feedback.",
      "Slow Start: Starts with cwnd = 1 MSS and doubles cwnd every RTT (exponential growth) until reaching ssthresh.",
      "Congestion Avoidance: Once cwnd >= ssthresh, switches to AIMD (Additive Increase Multiplicative Decrease) adding 1 MSS per RTT.",
      "On 3 Duplicate ACKs: Triggers Fast Retransmit (re-sends lost packet immediately) and enters Fast Recovery setting ssthresh = cwnd / 2 without dropping back to 1 MSS.",
      "On Timeout: cwnd drops to 1 MSS and enters Slow Start."
    ],
    diagramFormulaTip: "Draw a cwnd vs Transmission Round graph showing the exponential curve up to ssthresh, linear climb, sudden drop on 3 dup ACKs, and continued recovery.",
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'CN-02',
    subjectId: 'cn',
    subjectName: 'Computer Networks',
    unit: 3,
    unitTitle: 'Network Layer & Routing',
    question: "Compare Distance Vector and Link State Routing. Explain Count-to-Infinity and how Split Horizon and Poison Reverse mitigate it.",
    marks: 10,
    yearsAsked: [2021, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["Distance Vector", "Link State", "Bellman-Ford", "Dijkstra", "Count to Infinity", "Split Horizon", "Poison Reverse", "Routing Loop"],
    bullets: [
      "Distance Vector shares entire routing tables with direct neighbors only (Bellman-Ford); Link State floods link status to all network routers (Dijkstra).",
      "Count-to-Infinity occurs in Distance Vector when a link fails, and neighbors slowly increment distance costs in a loop believing alternate paths exist.",
      "Split Horizon: A router never advertises a route back out through the same interface it learned it from.",
      "Poison Reverse: Advertises the reverse route with an explicit metric of Infinity (16 in RIP), instantly poisoning the loop."
    ],
    diagramFormulaTip: "Draw a simple 3-node linear topology A --- B --- C, showing link B-C breaking and cost incrementing up to 16.",
    userStatus: 'not-started'
  },
  {
    id: 'CN-03',
    subjectId: 'cn',
    subjectName: 'Computer Networks',
    unit: 4,
    unitTitle: 'Transport Layer & TCP',
    question: "Explain the TCP Three-Way Handshake for connection establishment and Four-Way Handshake for connection termination.",
    marks: 5,
    yearsAsked: [2021, 2022, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["Three-Way Handshake", "SYN", "SYN-ACK", "ACK", "FIN", "TIME_WAIT", "Connection Establishment"],
    bullets: [
      "Step 1: Client sends SYN packet with Initial Sequence Number (ISN = x).",
      "Step 2: Server responds with SYN-ACK packet with its own sequence (seq = y) and acknowledgement (ack = x + 1).",
      "Step 3: Client confirms with ACK packet (seq = x + 1, ack = y + 1) and connection is established.",
      "Termination requires 4 steps (FIN -> ACK, then FIN -> ACK from other direction) with client entering TIME_WAIT state to ensure delayed packets drain."
    ],
    diagramFormulaTip: "Draw a vertical two-column ladder diagram (Client vs Server) with 3 diagonal arrows for connection and 4 diagonal arrows for termination.",
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'CN-04',
    subjectId: 'cn',
    subjectName: 'Computer Networks',
    unit: 5,
    unitTitle: 'Application Layer & DNS',
    question: "What is DNS? Differentiate between Recursive and Iterative DNS queries with a clean diagram.",
    marks: 2,
    yearsAsked: [2021, 2023, 2024],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ["DNS", "Recursive Query", "Iterative Query", "Domain Name", "IP Resolution"],
    bullets: [
      "DNS (Domain Name System) is a distributed hierarchical database that translates human-friendly domain names (google.com) into numerical IP addresses (142.250.x.x).",
      "Recursive Query: The client requests the local DNS server to resolve the address completely, taking full responsibility to query upstream servers.",
      "Iterative Query: The queried DNS server returns the best referral address it knows (Root, TLD, or Authoritative server) rather than resolving the complete name itself."
    ],
    diagramFormulaTip: "Draw Client -> Local DNS Resolver -> Root Server -> TLD Server (.com) -> Authoritative Server hierarchy.",
    userStatus: 'not-started'
  },

  // ==========================================
  // DATA STRUCTURES & ALGORITHMS
  // ==========================================
  {
    id: 'DSA-01',
    subjectId: 'dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 2,
    unitTitle: 'Trees & AVL Balancing',
    question: "Define an AVL Tree. Explain the Balance Factor and all four rotation cases (LL, RR, LR, RL) with an insertion sequence.",
    marks: 10,
    yearsAsked: [2021, 2022, 2023, 2024, 2025],
    repeatCount: 5,
    isHighProbability: true,
    expectedKeywords: ["AVL Tree", "Balance Factor", "LL Rotation", "RR Rotation", "LR Rotation", "RL Rotation", "Height Balanced", "O(log N)"],
    bullets: [
      "An AVL Tree is a self-balancing Binary Search Tree where the Balance Factor of any node is strictly within {-1, 0, +1}.",
      "Balance Factor Formula: BF = Height(Left Subtree) - Height(Right Subtree).",
      "Single Rotations: LL Rotation (Right Rotate at unbalanced node); RR Rotation (Left Rotate at unbalanced node).",
      "Double Rotations: LR Rotation (Left Rotate on Left Child, then Right Rotate on Node); RL Rotation (Right Rotate on Right Child, then Left Rotate on Node).",
      "Guarantees worst-case Search, Insertion, and Deletion time complexity of O(log N)."
    ],
    diagramFormulaTip: "Draw the 3-node triangular pivot rotation showing node A, B, C transforming after LL and LR rotations.",
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'DSA-02',
    subjectId: 'dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 4,
    unitTitle: 'Graphs & Dijkstra',
    question: "Explain Dijkstra's Single Source Shortest Path Algorithm. Analyze its time complexity with Adjacency List + Min-Heap. Why does it fail for negative edge weights?",
    marks: 10,
    yearsAsked: [2021, 2022, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["Dijkstras Algorithm", "Single Source Shortest Path", "Min-Heap", "Greedy Choice", "Negative Weights", "Relaxation", "Time Complexity"],
    bullets: [
      "Dijkstra solves single-source shortest paths on weighted graphs with non-negative edge weights using a Greedy approach.",
      "Relaxation Step: If dist[u] + weight(u, v) < dist[v], then update dist[v] = dist[u] + weight(u, v).",
      "Using an Adjacency List and Binary Min-Heap, the time complexity is O((V + E) * log V).",
      "Fails on Negative Weights because once a vertex is marked 'visited/settled', Dijkstra assumes its optimal shortest path is finalized and never revisits it."
    ],
    diagramFormulaTip: "Draw a 3-node triangle graph (A->B with cost 3, B->C with cost -5, A->C with cost 1) showing greedy error.",
    userStatus: 'not-started'
  },
  {
    id: 'DSA-03',
    subjectId: 'dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 5,
    unitTitle: 'Dynamic Programming',
    question: "Solve the 0/1 Knapsack problem using Dynamic Programming. Write the recurrence relation and trace the DP table.",
    marks: 10,
    yearsAsked: [2021, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ["0/1 Knapsack", "Dynamic Programming", "Recurrence Relation", "Optimal Substructure", "Overlapping Subproblems", "DP Table", "Pseudo-polynomial"],
    bullets: [
      "In 0/1 Knapsack, items cannot be broken into fractions; each item is either included (1) or excluded (0).",
      "Recurrence Relation: If wt[i-1] <= w, K[i][w] = max(val[i-1] + K[i-1][w - wt[i-1]], K[i-1][w]); Else K[i][w] = K[i-1][w].",
      "Base Cases: K[0][w] = 0 (no items) and K[i][0] = 0 (zero capacity).",
      "Time and Space Complexity: O(N * W), where N is the number of items and W is maximum knapsack capacity."
    ],
    diagramFormulaTip: "Draw a small DP grid with Rows (Items 0 to 4) and Columns (Weights 0 to 5) showing cell lookup arrows.",
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'DSA-04',
    subjectId: 'dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 1,
    unitTitle: 'Asymptotic Analysis & Lists',
    question: "State Master Theorem for solving divide-and-conquer recurrences: T(n) = a*T(n/b) + O(n^d).",
    marks: 2,
    yearsAsked: [2021, 2022, 2023, 2024, 2025],
    repeatCount: 5,
    isHighProbability: true,
    expectedKeywords: ["Master Theorem", "Divide and Conquer", "Asymptotic Complexity", "Logarithmic Base", "Recurrence Relation"],
    bullets: [
      "Applies to recurrences of form T(n) = a * T(n/b) + f(n) where f(n) = O(n^d).",
      "Case 1: If d < log_b(a) => T(n) = Θ(n^(log_b a)) [Leaf-heavy work].",
      "Case 2: If d = log_b(a) => T(n) = Θ(n^d * log n) [Evenly balanced work].",
      "Case 3: If d > log_b(a) => T(n) = Θ(n^d) [Root-heavy work]."
    ],
    diagramFormulaTip: "Write the 3 cases clearly separated with curly braces and compare with Merge Sort: T(n)=2T(n/2)+O(n) -> Case 2 -> O(n log n).",
    userStatus: 'not-started'
  }
];
