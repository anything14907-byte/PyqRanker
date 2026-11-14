import { SubjectMeta, SyllabusTopic, PYQQuestion, Flashcard } from '../types';

// Helper to calculate realistic default exam dates
const now = Date.now();
const toDateStr = (days: number, hours: number) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = new Date(now + (days * 24 + hours) * 3600 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const STANDARD_CS_SUBJECTS: SubjectMeta[] = [
  {
    id: 'se',
    code: 'CS-301',
    name: 'Software Engineering',
    iconName: 'Layers',
    accentColor: '#3F7D5F', // Forest Sage
    examDate: toDateStr(2, 14),
    units: [
      { id: 'se-u1', unit: 1, title: 'Software Process & Agile Methodologies', name: 'Software Process & Agile Methodologies' },
      { id: 'se-u2', unit: 2, title: 'Architectural Design, Modeling & Modularity', name: 'Architectural Design, Modeling & Modularity' },
      { id: 'se-u3', unit: 3, title: 'Testing Strategies & Quality Assurance', name: 'Testing Strategies & Quality Assurance' },
      { id: 'se-u4', unit: 4, title: 'Estimation, Risk Management & Maintenance', name: 'Estimation, Risk Management & Maintenance' },
    ]
  },
  {
    id: 'oopu',
    code: 'CS-302',
    name: 'Object Oriented Programming',
    iconName: 'Code',
    accentColor: '#B8892F', // Warm Ochre
    examDate: toDateStr(5, 10),
    units: [
      { id: 'oopu-u1', unit: 1, title: 'OOP Principles, Encapsulation & Memory Models', name: 'OOP Principles, Encapsulation & Memory Models' },
      { id: 'oopu-u2', unit: 2, title: 'Inheritance, Dynamic Binding & Virtual Functions', name: 'Inheritance, Dynamic Binding & Virtual Functions' },
      { id: 'oopu-u3', unit: 3, title: 'Exception Handling, Templates & Generic Programming', name: 'Exception Handling, Templates & Generic Programming' },
      { id: 'oopu-u4', unit: 4, title: 'Object-Oriented Design & Design Patterns', name: 'Object-Oriented Design & Design Patterns' },
    ]
  },
  {
    id: 'cn',
    code: 'CS-303',
    name: 'Computer Networks',
    iconName: 'Network',
    accentColor: '#10B981', // Emerald Mint
    examDate: toDateStr(9, 11),
    units: [
      { id: 'cn-u1', unit: 1, title: 'Protocol Architectures & Physical Layer', name: 'Protocol Architectures & Physical Layer' },
      { id: 'cn-u2', unit: 2, title: 'Data Link Layer, Flow & Error Control', name: 'Data Link Layer, Flow & Error Control' },
      { id: 'cn-u3', unit: 3, title: 'Network Layer, IP Addressing & Routing Protocols', name: 'Network Layer, IP Addressing & Routing Protocols' },
      { id: 'cn-u4', unit: 4, title: 'Transport Layer, TCP Congestion & Application Services', name: 'Transport Layer, TCP Congestion & Application Services' },
    ]
  },
  {
    id: 'pas',
    code: 'MA-304',
    name: 'Probability and Statistics',
    iconName: 'Brain',
    accentColor: '#B25A4E', // Terracotta
    examDate: toDateStr(14, 9),
    units: [
      { id: 'pas-u1', unit: 1, title: 'Probability Foundations & Discrete Random Variables', name: 'Probability Foundations & Discrete Random Variables' },
      { id: 'pas-u2', unit: 2, title: 'Standard Probability Distributions & Normal Curve', name: 'Standard Probability Distributions & Normal Curve' },
      { id: 'pas-u3', unit: 3, title: 'Two-Dimensional Random Variables & Sampling Theory', name: 'Two-Dimensional Random Variables & Sampling Theory' },
      { id: 'pas-u4', unit: 4, title: 'Hypothesis Testing & Regression Analysis', name: 'Hypothesis Testing & Regression Analysis' },
    ]
  },
  {
    id: 'os',
    code: 'CS-305',
    name: 'Operating Systems',
    iconName: 'Cpu',
    accentColor: '#3B6A94', // Muted Slate Blue
    examDate: toDateStr(17, 13),
    units: [
      { id: 'os-u1', unit: 1, title: 'Process Management & CPU Scheduling', name: 'Process Management & CPU Scheduling' },
      { id: 'os-u2', unit: 2, title: 'Process Synchronization & Deadlocks', name: 'Process Synchronization & Deadlocks' },
      { id: 'os-u3', unit: 3, title: 'Memory Management & Paging / TLB', name: 'Memory Management & Paging / TLB' },
      { id: 'os-u4', unit: 4, title: 'Storage, Disk Scheduling & File Systems', name: 'Storage, Disk Scheduling & File Systems' },
    ]
  },
  {
    id: 'dbms',
    code: 'CS-306',
    name: 'Database Systems',
    iconName: 'Database',
    accentColor: '#F97316', // Sunset Amber
    examDate: toDateStr(21, 15),
    units: [
      { id: 'dbms-u1', unit: 1, title: 'Relational Model & ER Architecture', name: 'Relational Model & ER Architecture' },
      { id: 'dbms-u2', unit: 2, title: 'SQL & Normalization (1NF to BCNF)', name: 'SQL & Normalization (1NF to BCNF)' },
      { id: 'dbms-u3', unit: 3, title: 'Transactions, ACID & Concurrency Control', name: 'Transactions, ACID & Concurrency Control' },
      { id: 'dbms-u4', unit: 4, title: 'Storage, B+ Trees & WAL Recovery', name: 'Storage, B+ Trees & WAL Recovery' },
    ]
  },
  {
    id: 'dsa',
    code: 'CS-307',
    name: 'Data Structures & Algorithms',
    iconName: 'Code',
    accentColor: '#06B6D4', // Ocean Cyan
    examDate: toDateStr(26, 10),
    units: [
      { id: 'dsa-u1', unit: 1, title: 'Complexity & Linear Data Structures', name: 'Complexity & Linear Data Structures' },
      { id: 'dsa-u2', unit: 2, title: 'Trees & Balanced Search Trees', name: 'Trees & Balanced Search Trees' },
      { id: 'dsa-u3', unit: 3, title: 'Heaps, Hashing & Priority Queues', name: 'Heaps, Hashing & Priority Queues' },
      { id: 'dsa-u4', unit: 4, title: 'Graph Algorithms & Dynamic Programming', name: 'Graph Algorithms & Dynamic Programming' },
    ]
  }
];

export const STANDARD_CS_TOPICS: SyllabusTopic[] = [
  // ==========================================
  // SOFTWARE ENGINEERING (SE)
  // ==========================================
  { id: 'top-se-101', subjectId: 'se', unitId: 'se-u1', unitNumber: 1, title: 'SDLC Phases & Classical Waterfall Model', completed: true, mastery: 'strong', pyqCount: 4, notes: 'Linear sequential flow. Requirements must be frozen upfront. Inflexible to late changes.' },
  { id: 'top-se-102', subjectId: 'se', unitId: 'se-u1', unitNumber: 1, title: 'Agile Methodology, Scrum Sprints & User Stories', completed: true, mastery: 'strong', pyqCount: 5, notes: 'Iterative 2-4 week sprints, daily standups, backlog grooming, and working software over documentation.' },
  { id: 'top-se-103', subjectId: 'se', unitId: 'se-u1', unitNumber: 1, title: 'Spiral Model, Risk Analysis & Prototyping', completed: false, mastery: 'okay', pyqCount: 3, notes: 'Boehm 4 quadrants: Objective setting, Risk assessment, Engineering development, Customer evaluation.' },
  { id: 'top-se-104', subjectId: 'se', unitId: 'se-u1', unitNumber: 1, title: 'Incremental & Rapid Application Development (RAD)', completed: false, mastery: 'weak', pyqCount: 2, notes: 'Component-based construction with tight 60-90 day delivery cycles.' },
  { id: 'top-se-105', subjectId: 'se', unitId: 'se-u1', unitNumber: 1, title: 'Software Requirements Specification (SRS) & IEEE 830', completed: false, mastery: 'weak', pyqCount: 4, notes: 'SRS must be Unambiguous, Complete, Verifiable, Consistent, and Modifiable.' },

  { id: 'top-se-201', subjectId: 'se', unitId: 'se-u2', unitNumber: 2, title: 'Data Flow Diagrams (DFD Level 0, 1, 2) & Dictionaries', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Entities, Processes, Data Stores, Data Flows. Rule: Data cannot flow directly between two external entities.' },
  { id: 'top-se-202', subjectId: 'se', unitId: 'se-u2', unitNumber: 2, title: 'UML Modeling: Use Case, Class & Sequence Diagrams', completed: false, mastery: 'strong', pyqCount: 5, notes: 'Static structure (Class diagrams) vs dynamic interaction (Sequence and State diagrams).' },
  { id: 'top-se-203', subjectId: 'se', unitId: 'se-u2', unitNumber: 2, title: 'Cohesion (Coincidental to Functional) & Coupling', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Golden Rule: High Functional Cohesion with Loose Data Coupling ensures maximum maintainability.' },
  { id: 'top-se-204', subjectId: 'se', unitId: 'se-u2', unitNumber: 2, title: 'Architectural Styles: Layered, Client-Server & Microservices', completed: false, mastery: 'okay', pyqCount: 3, notes: 'Decoupled domain boundaries, API gateways, independent deployment pipelines.' },
  { id: 'top-se-205', subjectId: 'se', unitId: 'se-u2', unitNumber: 2, title: 'Software Quality Attributes & Maintainability Index', completed: false, mastery: 'weak', pyqCount: 2, notes: 'Reliability, Efficiency, Usability, Maintainability, Portability (FURPS+ / ISO 25010).' },

  { id: 'top-se-301', subjectId: 'se', unitId: 'se-u3', unitNumber: 3, title: 'Black-Box Testing: Equivalence Partitioning & BVA', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Boundary Value Analysis tests min, min+1, nom, max-1, max. Catches off-by-one errors.' },
  { id: 'top-se-302', subjectId: 'se', unitId: 'se-u3', unitNumber: 3, title: 'White-Box Testing: Cyclomatic Complexity & Basis Path', completed: false, mastery: 'weak', pyqCount: 5, notes: 'McCabe formula: V(G) = E - N + 2P = P + 1 = Regions. Defines independent execution paths.' },
  { id: 'top-se-303', subjectId: 'se', unitId: 'se-u3', unitNumber: 3, title: 'Testing Hierarchy: Unit, Integration, System & Acceptance', completed: false, mastery: 'okay', pyqCount: 3, notes: 'Top-down (stubs) vs Bottom-up (drivers) integration testing strategies.' },
  { id: 'top-se-304', subjectId: 'se', unitId: 'se-u3', unitNumber: 3, title: 'Regression Testing & Automated CI/CD Test Pipelines', completed: false, mastery: 'strong', pyqCount: 2, notes: 'Re-running test suites to ensure bug fixes do not break existing working functionality.' },
  { id: 'top-se-305', subjectId: 'se', unitId: 'se-u3', unitNumber: 3, title: 'Quality Frameworks: ISO 9001, ISO 9126 & CMMI 5 Levels', completed: false, mastery: 'weak', pyqCount: 3, notes: 'CMMI Levels: 1-Initial, 2-Managed, 3-Defined, 4-Quantitatively Managed, 5-Optimizing.' },

  { id: 'top-se-401', subjectId: 'se', unitId: 'se-u4', unitNumber: 4, title: 'COCOMO I & II Effort Estimation Formulas', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Organic: E = 2.4(KLOC)^1.05; Semidetached: 3.0(KLOC)^1.12; Embedded: 3.6(KLOC)^1.20.' },
  { id: 'top-se-402', subjectId: 'se', unitId: 'se-u4', unitNumber: 4, title: 'Function Point Analysis (FPA) & Cost Metrics', completed: false, mastery: 'weak', pyqCount: 3, notes: 'Counts External Inputs, Outputs, Inquiries, Internal Logical Files, External Interfaces.' },
  { id: 'top-se-403', subjectId: 'se', unitId: 'se-u4', unitNumber: 4, title: 'Risk Management: Identification, Assessment & RMMM Plan', completed: false, mastery: 'okay', pyqCount: 4, notes: 'RMMM = Risk Mitigation, Monitoring, and Management plan for project contingencies.' },
  { id: 'top-se-404', subjectId: 'se', unitId: 'se-u4', unitNumber: 4, title: 'Software Maintenance: Corrective, Adaptive, Perfective, Preventive', completed: false, mastery: 'strong', pyqCount: 4, notes: 'Perfective maintenance accounts for ~50% of lifecycle cost (adding enhancements).' },
  { id: 'top-se-405', subjectId: 'se', unitId: 'se-u4', unitNumber: 4, title: 'Configuration Management (SCM), Baselines & Git Workflows', completed: false, mastery: 'okay', pyqCount: 2, notes: 'Version control, baseline audits, release change control boards (CCB).' },

  // ==========================================
  // OBJECT ORIENTED PROGRAMMING (OOPU)
  // ==========================================
  { id: 'top-oop-101', subjectId: 'oopu', unitId: 'oopu-u1', unitNumber: 1, title: 'Core OOP Pillars: Encapsulation & Data Hiding', completed: true, mastery: 'strong', pyqCount: 4, notes: 'Bundling data and methods into objects with access restricted via public getter/setter interfaces.' },
  { id: 'top-oop-102', subjectId: 'oopu', unitId: 'oopu-u1', unitNumber: 1, title: 'Constructors (Default, Parameterized, Copy) & Destructors', completed: true, mastery: 'strong', pyqCount: 5, notes: 'Copy constructor signature: ClassName(const ClassName &obj). Destructors free dynamic resources.' },
  { id: 'top-oop-103', subjectId: 'oopu', unitId: 'oopu-u1', unitNumber: 1, title: 'Class vs Object Memory Layout & "this" Pointer', completed: false, mastery: 'okay', pyqCount: 3, notes: 'Member variables occupy heap/stack memory per instance; member functions reside in code segment.' },
  { id: 'top-oop-104', subjectId: 'oopu', unitId: 'oopu-u1', unitNumber: 1, title: 'Static Variables, Static Methods & Friend Functions', completed: false, mastery: 'weak', pyqCount: 4, notes: 'Static members belong to class, not instance. Friend functions bypass private access boundaries.' },
  { id: 'top-oop-105', subjectId: 'oopu', unitId: 'oopu-u1', unitNumber: 1, title: 'Deep Copy vs Shallow Copy & Pointer Dangling', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Shallow copy copies raw memory addresses leading to double-free crashes. Deep copy allocates new buffer.' },

  { id: 'top-oop-201', subjectId: 'oopu', unitId: 'oopu-u2', unitNumber: 2, title: 'Inheritance Types: Single, Multiple & Hybrid Hierarchies', completed: false, mastery: 'strong', pyqCount: 4, notes: 'Code reusability and IS-A relationships across derived classes.' },
  { id: 'top-oop-202', subjectId: 'oopu', unitId: 'oopu-u2', unitNumber: 2, title: 'The Diamond Problem & Virtual Base Classes', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Virtual base classes ensure only one shared copy of common ancestor exists in derived object.' },
  { id: 'top-oop-203', subjectId: 'oopu', unitId: 'oopu-u2', unitNumber: 2, title: 'Compile-Time Overloading vs Run-Time Overriding', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Function/Operator overloading resolved by compiler signature; overriding resolved at runtime.' },
  { id: 'top-oop-204', subjectId: 'oopu', unitId: 'oopu-u2', unitNumber: 2, title: 'Virtual Functions, Pure Virtual Functions & Abstract Classes', completed: false, mastery: 'weak', pyqCount: 5, notes: 'virtual void draw() = 0 enforces contract on all subclasses. Cannot instantiate abstract class.' },
  { id: 'top-oop-205', subjectId: 'oopu', unitId: 'oopu-u2', unitNumber: 2, title: 'Virtual Table (vtable) & Virtual Pointer (vptr) Mechanics', completed: false, mastery: 'weak', pyqCount: 4, notes: 'Each polymorphic class has one vtable of function pointers; each instance carries a hidden vptr.' },

  { id: 'top-oop-301', subjectId: 'oopu', unitId: 'oopu-u3', unitNumber: 3, title: 'Exception Handling: try, catch, throw & Stack Unwinding', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Stack unwinding automatically invokes destructors for local objects when an exception propagates.' },
  { id: 'top-oop-302', subjectId: 'oopu', unitId: 'oopu-u3', unitNumber: 3, title: 'Custom Exception Hierarchies & Standard Exceptions', completed: false, mastery: 'weak', pyqCount: 3, notes: 'Subclassing std::exception and overriding const char* what() noexcept.' },
  { id: 'top-oop-303', subjectId: 'oopu', unitId: 'oopu-u3', unitNumber: 3, title: 'Function Templates & Class Templates Specialization', completed: false, mastery: 'okay', pyqCount: 4, notes: 'template <typename T> enables type-agnostic container design without code duplication.' },
  { id: 'top-oop-304', subjectId: 'oopu', unitId: 'oopu-u3', unitNumber: 3, title: 'Standard Template Library (STL): Vectors, Maps & Iterators', completed: false, mastery: 'strong', pyqCount: 4, notes: 'Dynamic contiguous array (vector) vs Red-Black Tree key-value store (map O(log N)).' },
  { id: 'top-oop-305', subjectId: 'oopu', unitId: 'oopu-u3', unitNumber: 3, title: 'RAII Idiom & Modern Smart Pointers (unique, shared, weak)', completed: false, mastery: 'weak', pyqCount: 4, notes: 'std::unique_ptr eliminates memory leaks through deterministic destructor scope release.' },

  { id: 'top-oop-401', subjectId: 'oopu', unitId: 'oopu-u4', unitNumber: 4, title: 'SOLID Design Principles in Software Construction', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.' },
  { id: 'top-oop-402', subjectId: 'oopu', unitId: 'oopu-u4', unitNumber: 4, title: 'Creational Patterns: Singleton & Factory Method', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Private constructor, static instance getter, thread-safe double-checked locking.' },
  { id: 'top-oop-403', subjectId: 'oopu', unitId: 'oopu-u4', unitNumber: 4, title: 'Structural Patterns: Adapter & Decorator', completed: false, mastery: 'weak', pyqCount: 3, notes: 'Adapter translates interfaces; Decorator attaches dynamic responsibilities without subclassing.' },
  { id: 'top-oop-404', subjectId: 'oopu', unitId: 'oopu-u4', unitNumber: 4, title: 'Behavioral Patterns: Observer & Strategy', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Observer decouples event publisher from subscribers (1-to-many event bus).' },
  { id: 'top-oop-405', subjectId: 'oopu', unitId: 'oopu-u4', unitNumber: 4, title: 'Object Serialization, Binary Streams & File Persistence', completed: false, mastery: 'strong', pyqCount: 3, notes: 'Writing memory state to byte streams and reconstructing object graphs reliably.' },

  // ==========================================
  // COMPUTER NETWORKS (CN)
  // ==========================================
  { id: 'top-cn-101', subjectId: 'cn', unitId: 'cn-u1', unitNumber: 1, title: 'OSI 7-Layer vs TCP/IP Protocol Architecture', completed: true, mastery: 'strong', pyqCount: 5, notes: 'Physical, Data Link, Network, Transport, Session, Presentation, Application layers.' },
  { id: 'top-cn-102', subjectId: 'cn', unitId: 'cn-u1', unitNumber: 1, title: 'Guided vs Unguided Media & Transmission Impairments', completed: true, mastery: 'strong', pyqCount: 3, notes: 'Attenuation, Delay Distortion, and Thermal Noise across copper, fiber, and RF.' },
  { id: 'top-cn-103', subjectId: 'cn', unitId: 'cn-u1', unitNumber: 1, title: 'Circuit Switching vs Packet Switching Networks', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Dedicated bandwidth reservation vs statistical multiplexing with packet headers.' },
  { id: 'top-cn-104', subjectId: 'cn', unitId: 'cn-u1', unitNumber: 1, title: 'Shannon Capacity Theorem & Nyquist Bit Rate', completed: false, mastery: 'weak', pyqCount: 5, notes: 'C = B * log2(1 + SNR). Nyquist: Max Bit Rate = 2B * log2(V) for noiseless channels.' },
  { id: 'top-cn-105', subjectId: 'cn', unitId: 'cn-u1', unitNumber: 1, title: 'Multiplexing: FDM, TDM, WDM & Spread Spectrum', completed: false, mastery: 'weak', pyqCount: 2, notes: 'Wavelength Division Multiplexing packs multiple light wavelengths into a single fiber.' },

  { id: 'top-cn-201', subjectId: 'cn', unitId: 'cn-u2', unitNumber: 2, title: 'Framing, Byte Stuffing & Bit Stuffing (01111110 Flag)', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Sender inserts a 0 bit after 5 consecutive 1s; receiver strips it to prevent flag collision.' },
  { id: 'top-cn-202', subjectId: 'cn', unitId: 'cn-u2', unitNumber: 2, title: 'Error Detection: CRC Checksum & Hamming Code', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Binary polynomial long division using modulo-2 XOR operations.' },
  { id: 'top-cn-203', subjectId: 'cn', unitId: 'cn-u2', unitNumber: 2, title: 'Sliding Window ARQ: Stop-and-Wait, Go-Back-N & Selective Repeat', completed: false, mastery: 'weak', pyqCount: 5, notes: 'GBN uses Sender Window 2^n - 1 and Receiver Window 1. SR uses Sender=2^(n-1), Receiver=2^(n-1).' },
  { id: 'top-cn-204', subjectId: 'cn', unitId: 'cn-u2', unitNumber: 2, title: 'MAC Protocols: Pure ALOHA, Slotted ALOHA & CSMA/CD', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Pure ALOHA max throughput = 18.4% (1/2e); Slotted ALOHA doubles throughput to 36.8% (1/e).' },
  { id: 'top-cn-205', subjectId: 'cn', unitId: 'cn-u2', unitNumber: 2, title: 'Ethernet Standards (IEEE 802.3), MAC Addresses & Bridges', completed: false, mastery: 'strong', pyqCount: 3, notes: '48-bit hardware MAC address, collision domains, full-duplex switch backplanes.' },

  { id: 'top-cn-301', subjectId: 'cn', unitId: 'cn-u3', unitNumber: 3, title: 'IPv4 Header Format & Subnet Masking (CIDR / VLSM)', completed: false, mastery: 'weak', pyqCount: 5, notes: '20-byte base header. Subnetting formula: 2^n - 2 usable host addresses per subnet.' },
  { id: 'top-cn-302', subjectId: 'cn', unitId: 'cn-u3', unitNumber: 3, title: 'Distance Vector Routing & Count-to-Infinity Problem', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Bellman-Ford equation D_x(y) = min_v{c(x,v) + D_v(y)}. Split horizon with poison reverse.' },
  { id: 'top-cn-303', subjectId: 'cn', unitId: 'cn-u3', unitNumber: 3, title: "Link State Routing & Dijkstra's Algorithm (OSPF)", completed: false, mastery: 'weak', pyqCount: 4, notes: 'Each node floods link-state advertisements (LSA) and computes shortest path tree locally.' },
  { id: 'top-cn-304', subjectId: 'cn', unitId: 'cn-u3', unitNumber: 3, title: 'ARP (Address Resolution Protocol), RARP & ICMP', completed: false, mastery: 'okay', pyqCount: 3, notes: 'ARP maps IP to MAC via broadcast request and unicast reply. ICMP handles ping and errors.' },
  { id: 'top-cn-305', subjectId: 'cn', unitId: 'cn-u3', unitNumber: 3, title: 'NAT (Network Address Translation) & IPv6 128-bit Addressing', completed: false, mastery: 'strong', pyqCount: 3, notes: 'Overcoming IPv4 exhaustion via private RFC 1918 subnets and port address translation (PAT).' },

  { id: 'top-cn-401', subjectId: 'cn', unitId: 'cn-u4', unitNumber: 4, title: 'TCP 3-Way Handshake & 4-Way Connection Teardown', completed: false, mastery: 'strong', pyqCount: 5, notes: 'SYN -> SYN-ACK -> ACK sequence with random Initial Sequence Numbers (ISN).' },
  { id: 'top-cn-402', subjectId: 'cn', unitId: 'cn-u4', unitNumber: 4, title: 'TCP Congestion Control: Slow Start, AIMD & Fast Recovery', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Exponential cwnd doubling during Slow Start, Additive Increase Multiplicative Decrease in CA.' },
  { id: 'top-cn-403', subjectId: 'cn', unitId: 'cn-u4', unitNumber: 4, title: 'UDP vs TCP: Reliability vs Real-Time Streaming', completed: false, mastery: 'strong', pyqCount: 3, notes: 'UDP 8-byte header without connection handshake, flow control, or congestion control.' },
  { id: 'top-cn-404', subjectId: 'cn', unitId: 'cn-u4', unitNumber: 4, title: 'DNS Resolution: Root, TLD & Authoritative Nameservers', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Iterative vs recursive queries, TTL caching, port 53 UDP/TCP.' },
  { id: 'top-cn-405', subjectId: 'cn', unitId: 'cn-u4', unitNumber: 4, title: 'HTTP/1.1 vs HTTP/2 (Multiplexing) vs HTTP/3 (QUIC/UDP)', completed: false, mastery: 'weak', pyqCount: 3, notes: 'HTTP/2 introduces single-TCP binary framing; HTTP/3 eliminates TCP head-of-line blocking.' },

  // ==========================================
  // PROBABILITY AND STATISTICS (PAS)
  // ==========================================
  { id: 'top-pas-101', subjectId: 'pas', unitId: 'pas-u1', unitNumber: 1, title: 'Axioms of Probability, Addition & Multiplication Theorems', completed: true, mastery: 'strong', pyqCount: 4, notes: 'Kolmogorov axioms: P(S)=1, 0 <= P(A) <= 1, countable additivity for disjoint events.' },
  { id: 'top-pas-102', subjectId: 'pas', unitId: 'pas-u1', unitNumber: 1, title: 'Conditional Probability & Bayes Theorem', completed: true, mastery: 'strong', pyqCount: 5, notes: 'P(A|B) = P(B|A)P(A) / P(B). Fundamental for updating prior beliefs with sample evidence.' },
  { id: 'top-pas-103', subjectId: 'pas', unitId: 'pas-u1', unitNumber: 1, title: 'Discrete Random Variables, PMF & CDF Functions', completed: false, mastery: 'okay', pyqCount: 3, notes: 'Sum of p(x) equals 1. F(x) = P(X <= x) is non-decreasing right-continuous step function.' },
  { id: 'top-pas-104', subjectId: 'pas', unitId: 'pas-u1', unitNumber: 1, title: 'Mathematical Expectation E[X], Variance & Moments', completed: false, mastery: 'weak', pyqCount: 4, notes: 'E[X] = sum(x*p(x)). Var(X) = E[X^2] - (E[X])^2. Standard Deviation = sqrt(Var).' },
  { id: 'top-pas-105', subjectId: 'pas', unitId: 'pas-u1', unitNumber: 1, title: 'Moment Generating Functions (MGF) & Properties', completed: false, mastery: 'weak', pyqCount: 4, notes: 'M_X(t) = E[e^(tX)]. k-th derivative at t=0 gives the k-th raw moment E[X^k].' },

  { id: 'top-pas-201', subjectId: 'pas', unitId: 'pas-u2', unitNumber: 2, title: 'Binomial Distribution: Mean np & Variance npq', completed: false, mastery: 'strong', pyqCount: 4, notes: 'P(X=k) = C(n,k) * p^k * (1-p)^(n-k). Mean always strictly greater than Variance.' },
  { id: 'top-pas-202', subjectId: 'pas', unitId: 'pas-u2', unitNumber: 2, title: 'Poisson Distribution & Rare Event Approximations', completed: false, mastery: 'weak', pyqCount: 5, notes: 'P(X=k) = (lambda^k * e^-lambda) / k!. Mean = Variance = lambda.' },
  { id: 'top-pas-203', subjectId: 'pas', unitId: 'pas-u2', unitNumber: 2, title: 'Continuous Random Variables & Probability Density (PDF)', completed: false, mastery: 'okay', pyqCount: 3, notes: 'Integral from -inf to +inf of f(x)dx = 1. Probability at any single exact point is 0.' },
  { id: 'top-pas-204', subjectId: 'pas', unitId: 'pas-u2', unitNumber: 2, title: 'Normal / Gaussian Distribution & Standard Z-Scores', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Bell curve symmetrical about mean mu. Standard Normal Z = (X - mu) / sigma.' },
  { id: 'top-pas-205', subjectId: 'pas', unitId: 'pas-u2', unitNumber: 2, title: 'Exponential Distribution & Memoryless Property', completed: false, mastery: 'weak', pyqCount: 4, notes: 'P(X > s + t | X > s) = P(X > t). Models component lifespans and service waiting queues.' },

  { id: 'top-pas-301', subjectId: 'pas', unitId: 'pas-u3', unitNumber: 3, title: 'Joint Probability Distributions & Marginal Densities', completed: false, mastery: 'weak', pyqCount: 4, notes: 'Joint PDF f(x,y). Marginal f_X(x) = int f(x,y)dy. X and Y independent iff f(x,y) = f_X(x)*f_Y(y).' },
  { id: 'top-pas-302', subjectId: 'pas', unitId: 'pas-u3', unitNumber: 3, title: 'Covariance & Pearson Correlation Coefficient (r)', completed: false, mastery: 'okay', pyqCount: 4, notes: 'r = Cov(X,Y) / (sigma_X * sigma_Y). Bound strictly between -1 and +1.' },
  { id: 'top-pas-303', subjectId: 'pas', unitId: 'pas-u3', unitNumber: 3, title: 'Central Limit Theorem (CLT) & Sample Means', completed: false, mastery: 'weak', pyqCount: 5, notes: 'For large n (n >= 30), sample mean distribution approaches Normal N(mu, sigma^2/n).' },
  { id: 'top-pas-304', subjectId: 'pas', unitId: 'pas-u3', unitNumber: 3, title: 'Chebyshev Inequality & Weak Law of Large Numbers', completed: false, mastery: 'weak', pyqCount: 3, notes: 'P(|X - mu| >= k*sigma) <= 1/k^2. Guarantees convergence in probability.' },
  { id: 'top-pas-305', subjectId: 'pas', unitId: 'pas-u3', unitNumber: 3, title: 'Sampling Theory & Standard Error of the Mean', completed: false, mastery: 'strong', pyqCount: 3, notes: 'Standard Error = sigma / sqrt(n). Decreases with square root of sample size.' },

  { id: 'top-pas-401', subjectId: 'pas', unitId: 'pas-u4', unitNumber: 4, title: 'Hypothesis Testing Framework: Null (H0) & Alternative (H1)', completed: false, mastery: 'strong', pyqCount: 4, notes: 'Reject H0 when test statistic falls into critical rejection region defined by alpha.' },
  { id: 'top-pas-402', subjectId: 'pas', unitId: 'pas-u4', unitNumber: 4, title: 'Type I Error (Alpha), Type II Error (Beta) & Power of Test', completed: false, mastery: 'weak', pyqCount: 5, notes: 'Type I: Rejecting true H0 (False Alarm). Type II: Failing to reject false H0. Power = 1 - beta.' },
  { id: 'top-pas-403', subjectId: 'pas', unitId: 'pas-u4', unitNumber: 4, title: 'Large Sample Z-Tests for Single Mean & Difference of Means', completed: false, mastery: 'okay', pyqCount: 4, notes: 'Critical values: Z = 1.96 for two-tailed test at 5% alpha; Z = 2.58 at 1% alpha.' },
  { id: 'top-pas-404', subjectId: 'pas', unitId: 'pas-u4', unitNumber: 4, title: "Small Sample Student's t-Test & Paired t-Test", completed: false, mastery: 'weak', pyqCount: 5, notes: 'Used when population variance is unknown and n < 30. Degrees of freedom = n - 1.' },
  { id: 'top-pas-405', subjectId: 'pas', unitId: 'pas-u4', unitNumber: 4, title: 'Chi-Square (χ²) Test of Independence & Contingency Tables', completed: false, mastery: 'weak', pyqCount: 4, notes: 'Chi-Square = sum((O - E)^2 / E). Degrees of freedom for (r x c) table = (r - 1)(c - 1).' }
];

export const STANDARD_CS_PYQS: PYQQuestion[] = [
  // ==========================================
  // SOFTWARE ENGINEERING PYQS
  // ==========================================
  {
    id: 'PYQ-SE-01',
    subjectId: 'se',
    subjectName: 'Software Engineering',
    unit: 1,
    unitTitle: 'Software Process & Agile Methodologies',
    question: 'Compare Waterfall, Spiral, and Agile Scrum software process models. State the conditions under which each model is preferred.',
    marks: 10,
    yearsAsked: [2022, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ['Waterfall', 'Spiral Model', 'Agile Scrum', 'Risk Analysis', 'Iterative Sprint', 'Requirements Stability'],
    bullets: [
      'Waterfall Model enforces strict linear phases: Requirements -> Design -> Implementation -> Testing -> Deployment. Best for stable, well-understood requirements with zero expected scope changes.',
      'Spiral Model combines waterfall discipline with iterative prototyping driven by explicit risk assessment. Divided into 4 quadrants: Objective setting, Risk mitigation, Product development, and Customer review. Ideal for large, mission-critical projects.',
      'Agile Scrum embraces volatile requirements through fixed 2-4 week sprint cycles, prioritized product backlogs, daily standups, and deployable increments. Preferred for dynamic web and cloud applications.'
    ],
    diagramFormulaTip: 'Draw a comparison matrix table with columns: Model | Requirement Volatility | Risk Driven | Customer Involvement | Delivery Timeline.',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-SE-02',
    subjectId: 'se',
    subjectName: 'Software Engineering',
    unit: 1,
    unitTitle: 'Software Process & Agile Methodologies',
    question: 'Explain the Requirements Engineering process. What are the key characteristics of a good Software Requirements Specification (SRS) according to IEEE 830?',
    marks: 10,
    yearsAsked: [2021, 2023, 2024],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ['Requirements Elicitation', 'Analysis', 'Specification', 'Validation', 'IEEE 830', 'Unambiguous', 'Verifiable'],
    bullets: [
      'Requirements Engineering comprises 4 continuous steps: Elicitation (interviews, workshops), Analysis (conflict resolution), Specification (formal SRS document), and Validation (review inspections).',
      'IEEE 830 Key Quality Metrics:',
      '1. Unambiguous: Every requirement has only one exact interpretation.',
      '2. Complete: Covers all functional scenarios, system constraints, and error handling.',
      '3. Verifiable: Quantifiable test criteria exist to verify whether each requirement is satisfied.',
      '4. Consistent: No contradictory requirements between functional modules.',
      '5. Modifiable & Traceable: Backward and forward traceability links to source code and tests.'
    ],
    diagramFormulaTip: 'Draw the 4-stage circular Requirements Engineering loop: Elicitation -> Analysis -> Specification -> Validation.',
    userStatus: 'not-started'
  },
  {
    id: 'PYQ-SE-03',
    subjectId: 'se',
    subjectName: 'Software Engineering',
    unit: 2,
    unitTitle: 'Architectural Design, Modeling & Modularity',
    question: 'Define Cohesion and Coupling. Differentiate various types of Cohesion and Coupling and explain why software designers aim for "High Cohesion and Low Coupling".',
    marks: 10,
    yearsAsked: [2021, 2022, 2023, 2024, 2025],
    repeatCount: 5,
    isHighProbability: true,
    expectedKeywords: ['Cohesion', 'Coupling', 'Functional Cohesion', 'Data Coupling', 'Content Coupling', 'Modularity', 'Maintainability'],
    bullets: [
      'Cohesion measures intra-module functional strength (how focused elements inside a module are). Types (Worst to Best): Coincidental < Logical < Temporal < Procedural < Communicational < Sequential < Functional.',
      'Coupling measures inter-module dependency strength. Types (Worst to Best): Content < Common < Control < Stamp < Data Coupling.',
      'High Functional Cohesion ensures every module has a single clear purpose, dramatically simplifying debugging and unit testing.',
      'Low Data Coupling ensures modules communicate strictly via parameter data passing without accessing internal private states, preventing ripple-effect bugs.'
    ],
    diagramFormulaTip: 'Draw a 2-column ladder ranking Cohesion from bottom (Coincidental) to top (Functional) and Coupling from top (Content) to bottom (Data).',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-SE-04',
    subjectId: 'se',
    subjectName: 'Software Engineering',
    unit: 2,
    unitTitle: 'Architectural Design, Modeling & Modularity',
    question: 'Draw Level 0 (Context Diagram) and Level 1 Data Flow Diagrams (DFD) for an Online Examination and Study Tracker System.',
    marks: 10,
    yearsAsked: [2022, 2024],
    repeatCount: 2,
    isHighProbability: true,
    expectedKeywords: ['DFD Level 0', 'Context Diagram', 'Level 1 DFD', 'Process Bubble', 'Data Store', 'External Entity'],
    bullets: [
      'DFD Notation: Rectangles = External Entities (Student, Admin); Circles/Bubbles = Processes; Open Rectangles = Data Stores (PYQ Database, Topic Registry); Arrows = Data Flows.',
      'Level 0 Context Diagram depicts the entire system as a single central bubble "Online Exam & Study OS" interacting with external entities Student and Faculty.',
      'Level 1 DFD decomposes the central process into 4 sub-processes: 1.0 User Authentication, 2.0 Syllabus Topic Management, 3.0 PYQ Practice Engine, and 4.0 Exam Readiness Analytics.',
      'Strict Rule: Data flows can never occur directly between two external entities or between two data stores without an intervening process bubble.'
    ],
    diagramFormulaTip: 'Draw the central bubble with numbered inputs: Credentials, Study Log, and outputs: Test Report, Flashcard Schedule.',
    userStatus: 'not-started'
  },
  {
    id: 'PYQ-SE-05',
    subjectId: 'se',
    subjectName: 'Software Engineering',
    unit: 3,
    unitTitle: 'Testing Strategies & Quality Assurance',
    question: "Explain Cyclomatic Complexity with an example. Calculate McCabe's Cyclomatic Complexity V(G) using all 3 standard formulas.",
    marks: 10,
    yearsAsked: [2021, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ['Cyclomatic Complexity', 'Control Flow Graph', 'Basis Paths', 'Predicate Nodes', 'McCabe Formula'],
    bullets: [
      "McCabe's Cyclomatic Complexity V(G) measures the logical complexity of source code by quantifying the number of linearly independent execution paths.",
      'Method 1 (Edges & Nodes): V(G) = E - N + 2P, where E is number of edges, N is number of nodes, and P is connected components (P=1 for single program).',
      'Method 2 (Predicate Decision Nodes): V(G) = P + 1, where P is the number of decision/conditional branch nodes (if, while, for).',
      'Method 3 (Enclosed Bounded Regions): V(G) = R, where R is the total number of closed graphical regions plus 1 unbounded outer region.',
      'Significance: Defines the exact minimum number of white-box test cases required to guarantee 100% statement and branch coverage.'
    ],
    diagramFormulaTip: 'Draw a simple Control Flow Graph with 1 entry node, 2 decision branches, and 1 merge node. Label Edges E=6, Nodes N=5, Predicate P=2, V(G)=3.',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-SE-06',
    subjectId: 'se',
    subjectName: 'Software Engineering',
    unit: 3,
    unitTitle: 'Testing Strategies & Quality Assurance',
    question: 'Differentiate between Black-Box and White-Box Testing. Illustrate Boundary Value Analysis (BVA) and Equivalence Class Partitioning.',
    marks: 10,
    yearsAsked: [2022, 2024, 2025],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ['Black-Box Testing', 'White-Box Testing', 'Equivalence Partitioning', 'Boundary Value Analysis', 'Test Case Design'],
    bullets: [
      'Black-Box (Functional) testing validates system requirements without examining internal source code or architecture. White-Box (Structural) testing examines code logic, loops, and conditions.',
      'Equivalence Class Partitioning divides input domain into valid and invalid partitions, selecting one representative test value from each class to minimize redundancy.',
      'Boundary Value Analysis (BVA) focuses specifically on boundary edges where developers most frequently commit off-by-one errors.',
      'For input range [min, max], BVA selects 5 standard test points: min, min+1, nominal, max-1, and max.'
    ],
    diagramFormulaTip: 'Draw a horizontal number line from min=18 to max=60 showing test points: 17 (invalid), 18, 19, 35, 59, 60, and 61 (invalid).',
    userStatus: 'not-started'
  },
  {
    id: 'PYQ-SE-07',
    subjectId: 'se',
    subjectName: 'Software Engineering',
    unit: 4,
    unitTitle: 'Estimation, Risk Management & Maintenance',
    question: 'Explain the Basic and Intermediate COCOMO models. Calculate Effort and Development Time for an Organic software system of 50 KLOC.',
    marks: 10,
    yearsAsked: [2021, 2022, 2024],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ['COCOMO Model', 'Effort Person-Months', 'Development Time', 'Organic Mode', 'KLOC', 'Cost Drivers'],
    bullets: [
      'Constructive Cost Model (COCOMO) estimates software project cost, effort, and duration based on size in KLOC (Thousands of Lines of Code).',
      'Three Project Categories: Organic (small team, familiar domain), Semidetached (medium size/complexity), Embedded (rigid constraints, flight control).',
      'Basic COCOMO Equations for Organic Mode: Effort E = 2.4 * (KLOC)^1.05 Person-Months (PM); Development Time D = 2.5 * (E)^0.38 Months.',
      'Sample Calculation (50 KLOC Organic):',
      'Effort E = 2.4 * (50)^1.05 = 2.4 * 60.85 = 146.04 Person-Months.',
      'Duration D = 2.5 * (146.04)^0.38 = 2.5 * 6.67 = 16.68 Months.',
      'Average Staff Required = Effort / Duration = 146.04 / 16.68 ≈ 8.75 Engineers.'
    ],
    diagramFormulaTip: 'Write the 3-row formula table for Organic (2.4, 1.05), Semidetached (3.0, 1.12), and Embedded (3.6, 1.20).',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-SE-08',
    subjectId: 'se',
    subjectName: 'Software Engineering',
    unit: 4,
    unitTitle: 'Estimation, Risk Management & Maintenance',
    question: 'Describe the 4 types of Software Maintenance. Detail the components of a comprehensive RMMM (Risk Mitigation, Monitoring, and Management) plan.',
    marks: 10,
    yearsAsked: [2023, 2025],
    repeatCount: 2,
    isHighProbability: true,
    expectedKeywords: ['Corrective', 'Adaptive', 'Perfective', 'Preventive Maintenance', 'RMMM Plan', 'Risk Mitigation'],
    bullets: [
      'Four Types of Software Maintenance:',
      '1. Corrective (20%): Fixing residual bugs discovered in production.',
      '2. Adaptive (25%): Modifying software to adapt to changing OS, cloud, or hardware environments.',
      '3. Perfective (50%): Implementing user-requested enhancements, performance optimizations, and UI upgrades.',
      '4. Preventive (5%): Re-engineering, documentation updates, and technical debt refactoring.',
      'RMMM Plan Structure: Risk Mitigation (proactive prevention steps before risk occurs), Risk Monitoring (tracking probability indicators during development), and Risk Management (contingency execution if risk materializes).'
    ],
    diagramFormulaTip: 'Draw a maintenance cost pie chart: 50% Perfective, 25% Adaptive, 20% Corrective, 5% Preventive.',
    userStatus: 'not-started'
  },

  // ==========================================
  // OBJECT ORIENTED PROGRAMMING PYQS
  // ==========================================
  {
    id: 'PYQ-OOP-01',
    subjectId: 'oopu',
    subjectName: 'Object Oriented Programming',
    unit: 1,
    unitTitle: 'OOP Principles, Encapsulation & Memory Models',
    question: 'Explain Deep Copy vs. Shallow Copy with C++ code examples and memory diagrams. Why must classes with pointer members provide a custom Copy Constructor?',
    marks: 10,
    yearsAsked: [2021, 2022, 2023, 2024],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ['Shallow Copy', 'Deep Copy', 'Copy Constructor', 'Dangling Pointer', 'Heap Memory', 'Destructor Double Free'],
    bullets: [
      'Shallow copy performs bitwise copying of member variables. If an object contains a pointer to dynamic heap memory, shallow copy merely duplicates the raw memory address.',
      'Dangling Pointer Problem: When the first object is destroyed, its destructor frees the shared heap buffer. The second object is left with a dangling pointer; when it destructs, a fatal double-free crash occurs.',
      'Deep copy allocates a separate, brand-new heap memory block for the copy and duplicates the actual underlying values.',
      'Rule of Three: If a class requires a user-defined Destructor, it almost certainly requires a custom Copy Constructor and Copy Assignment Operator.'
    ],
    diagramFormulaTip: 'Draw two stack object boxes (Obj1, Obj2). Show Shallow Copy pointing to the same Heap block, and Deep Copy pointing to two distinct Heap blocks.',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-OOP-02',
    subjectId: 'oopu',
    subjectName: 'Object Oriented Programming',
    unit: 2,
    unitTitle: 'Inheritance, Dynamic Binding & Virtual Functions',
    question: 'Explain how Run-Time Polymorphism is implemented under the hood using Virtual Table (vtable) and Virtual Pointer (vptr). Trace the lookup sequence.',
    marks: 10,
    yearsAsked: [2021, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ['Virtual Table', 'vtable', 'vptr', 'Dynamic Binding', 'Late Binding', 'Function Pointer', 'Base Pointer'],
    bullets: [
      'When a class declares at least one virtual function, the compiler inserts a hidden pointer member `vptr` into every class instance and generates a single static `vtable` array per polymorphic class.',
      'The `vtable` contains memory addresses of all virtual functions accessible by that class.',
      'During object construction, the constructor initializes `vptr` to point directly to that class\'s specific `vtable`.',
      'Runtime Invocation Sequence (`basePtr->show()`):',
      '1. CPU dereferences `basePtr` to locate the instance on heap/stack.',
      '2. Extracts the hidden `vptr` stored at the beginning of the object layout.',
      '3. Indexes into the `vtable` at the compile-time slot offset for `show()`.',
      '4. Indirectly jumps to the target overridden function address.'
    ],
    diagramFormulaTip: 'Draw an Object instance with hidden vptr arrow pointing to a table titled "vtable [Derived::show(), Derived::print()]".',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-OOP-03',
    subjectId: 'oopu',
    subjectName: 'Object Oriented Programming',
    unit: 2,
    unitTitle: 'Inheritance, Dynamic Binding & Virtual Functions',
    question: 'Explain the Diamond Problem in Multiple Inheritance. How do Virtual Base Classes resolve inheritance ambiguity?',
    marks: 10,
    yearsAsked: [2022, 2024],
    repeatCount: 2,
    isHighProbability: true,
    expectedKeywords: ['Diamond Problem', 'Multiple Inheritance', 'Virtual Base Class', 'Ambiguity', 'Single Instance'],
    bullets: [
      'The Diamond Problem occurs in hybrid inheritance when a class (D) inherits from two intermediate classes (B and C), both of which inherit from a common base class (A).',
      'Without virtual inheritance, class D receives two separate duplicate instances of base class A, causing compile-time member ambiguity errors (e.g. `d.x` is ambiguous).',
      'Virtual Base Class Solution (`class B : virtual public A`, `class C : virtual public A`):',
      'Informs the compiler to maintain only ONE shared instance of class A within the final derived object D layout.',
      'Constructor Responsibility: The most-derived class (D) becomes directly responsible for invoking class A\'s constructor.'
    ],
    diagramFormulaTip: 'Draw a diamond graph: Node A at top branching to B and C, which both merge down into Node D.',
    userStatus: 'not-started'
  },
  {
    id: 'PYQ-OOP-04',
    subjectId: 'oopu',
    subjectName: 'Object Oriented Programming',
    unit: 3,
    unitTitle: 'Exception Handling, Templates & Generic Programming',
    question: 'Explain Stack Unwinding during C++ Exception Handling. Write a generic Template Class for a Dynamic Stack with push(), pop(), and peek().',
    marks: 10,
    yearsAsked: [2023, 2024, 2025],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ['Stack Unwinding', 'try catch throw', 'Destructor Invocation', 'Template Class', 'RAII'],
    bullets: [
      'Stack Unwinding is the runtime process that cleans up the call stack when an exception is thrown inside a try block.',
      'As control searches back through nested function calls for an enclosing matching catch block, all local objects constructed along that call stack have their destructors automatically invoked in reverse order of construction.',
      'Guarantees zero resource leaks when using the RAII pattern (Resource Acquisition Is Initialization).',
      'Generic Stack Template Skeleton: template <typename T> class Stack { T* arr; int top, cap; public: void push(T val); T pop(); T peek(); };'
    ],
    diagramFormulaTip: 'Draw call stack frames: main() -> funcA() -> funcB() [throw]. Show red arrow unwinding downwards, destroying local objects.',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-OOP-05',
    subjectId: 'oopu',
    subjectName: 'Object Oriented Programming',
    unit: 4,
    unitTitle: 'Object-Oriented Design & Design Patterns',
    question: 'Explain the 5 SOLID Object-Oriented Design Principles with illustrative code examples.',
    marks: 10,
    yearsAsked: [2022, 2023, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ['SOLID', 'Single Responsibility', 'Open Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'],
    bullets: [
      '1. Single Responsibility (SRP): A class should have only one reason to change.',
      '2. Open/Closed (OCP): Software entities should be open for extension, but closed for modification (achieved via interfaces and abstract classes).',
      '3. Liskov Substitution (LSP): Subtypes must be substitutable for their base types without altering program correctness.',
      '4. Interface Segregation (ISP): Clients should not be forced to depend on interfaces they do not use (prefer small, role-specific interfaces).',
      '5. Dependency Inversion (DIP): High-level modules should not depend on low-level modules; both must depend on abstractions.'
    ],
    diagramFormulaTip: 'Draw 5 stacked blocks labeled S-O-L-I-D with a one-sentence rule inside each block.',
    userStatus: 'not-started',
    bookmarked: true
  },

  // ==========================================
  // PROBABILITY AND STATISTICS PYQS
  // ==========================================
  {
    id: 'PYQ-PAS-01',
    subjectId: 'pas',
    subjectName: 'Probability and Statistics',
    unit: 1,
    unitTitle: 'Probability Foundations & Discrete Random Variables',
    question: "State and prove Bayes' Theorem. In a factory, Machine A produces 60% of output (2% defective) and Machine B produces 40% (4% defective). An item chosen at random is defective; find the probability it was produced by Machine B.",
    marks: 10,
    yearsAsked: [2021, 2022, 2023, 2024],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ['Bayes Theorem', 'Total Probability', 'Prior Probability', 'Posterior Probability', 'Defective Rate'],
    bullets: [
      "Bayes' Theorem Formula: P(B_i | A) = [ P(A | B_i) * P(B_i) ] / [ sum_j P(A | B_j) * P(B_j) ].",
      'Given: P(M_A) = 0.60, P(D | M_A) = 0.02. P(M_B) = 0.40, P(D | M_B) = 0.04.',
      'Total Probability of Defective Item P(D):',
      'P(D) = P(D | M_A)*P(M_A) + P(D | M_B)*P(M_B) = (0.02 * 0.60) + (0.04 * 0.40) = 0.012 + 0.016 = 0.028.',
      'Posterior Probability P(M_B | D):',
      'P(M_B | D) = [ P(D | M_B) * P(M_B) ] / P(D) = 0.016 / 0.028 = 16 / 28 = 4/7 ≈ 0.5714 (57.14%).'
    ],
    diagramFormulaTip: 'Draw a tree diagram: Root branches to M_A (0.60) and M_B (0.40). M_A branches to D (0.02), M_B branches to D (0.04).',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-PAS-02',
    subjectId: 'pas',
    subjectName: 'Probability and Statistics',
    unit: 2,
    unitTitle: 'Standard Probability Distributions & Normal Curve',
    question: 'Derive the Mean and Variance of a Poisson Distribution. A call center receives an average of 3 calls per minute; find the probability of receiving at least 2 calls in a minute.',
    marks: 10,
    yearsAsked: [2022, 2024, 2025],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ['Poisson Distribution', 'Parameter Lambda', 'Mean Variance Equality', 'Recurrence Relation'],
    bullets: [
      'Poisson PMF: P(X = k) = (lambda^k * e^-lambda) / k! for k = 0, 1, 2, ...',
      'Derivation of Mean: E[X] = sum_{k=0}^inf k * (lambda^k * e^-lambda) / k! = lambda.',
      'Derivation of Variance: E[X(X-1)] = lambda^2 => E[X^2] = lambda^2 + lambda. Var(X) = E[X^2] - (E[X])^2 = lambda. (Mean = Variance = lambda).',
      'Numerical Calculation (lambda = 3):',
      'P(X >= 2) = 1 - [ P(X = 0) + P(X = 1) ]',
      'P(X = 0) = e^-3 * 3^0 / 0! = e^-3 ≈ 0.0498',
      'P(X = 1) = e^-3 * 3^1 / 1! = 3 * e^-3 ≈ 0.1494',
      'P(X >= 2) = 1 - (0.0498 + 0.1494) = 1 - 0.1992 = 0.8008 (80.08%).'
    ],
    diagramFormulaTip: 'Write the PMF formula clearly on line 1, then show step-by-step substitution for k=0 and k=1.',
    userStatus: 'not-started',
    bookmarked: true
  },
  {
    id: 'PYQ-PAS-03',
    subjectId: 'pas',
    subjectName: 'Probability and Statistics',
    unit: 3,
    unitTitle: 'Two-Dimensional Random Variables & Sampling Theory',
    question: 'State and explain the Central Limit Theorem (CLT). A battery has mean life 40 hours with std dev 5 hours. Find the probability that a sample of 25 batteries has average life between 38 and 42 hours.',
    marks: 10,
    yearsAsked: [2021, 2023, 2025],
    repeatCount: 3,
    isHighProbability: true,
    expectedKeywords: ['Central Limit Theorem', 'Sample Mean Distribution', 'Standard Error', 'Z Score', 'Normal Approximation'],
    bullets: [
      'Central Limit Theorem: If independent random variables X1, X2... Xn are drawn from any population with mean mu and variance sigma^2, the standardized sample mean Z = (X_bar - mu) / (sigma / sqrt(n)) approaches a standard normal distribution N(0, 1) as n increases.',
      'Given: mu = 40, sigma = 5, n = 25. Standard Error SE = sigma / sqrt(n) = 5 / sqrt(25) = 1.0 hour.',
      'Compute Z-scores for 38 and 42:',
      'Z1 = (38 - 40) / 1.0 = -2.0',
      'Z2 = (42 - 40) / 1.0 = +2.0',
      'Probability: P(38 <= X_bar <= 42) = P(-2.0 <= Z <= +2.0) = Phi(2.0) - Phi(-2.0) = 0.9772 - 0.0228 = 0.9544 (95.44%).'
    ],
    diagramFormulaTip: 'Draw a standard normal bell curve with mean 0, shaded from Z = -2.0 to Z = +2.0 with area label 95.44%.',
    userStatus: 'not-started'
  },
  {
    id: 'PYQ-PAS-04',
    subjectId: 'pas',
    subjectName: 'Probability and Statistics',
    unit: 4,
    unitTitle: 'Hypothesis Testing & Regression Analysis',
    question: 'Explain the procedure of Testing of Hypothesis. Distinguish Type I and Type II errors. A sample of 100 students has mean height 168 cm with std dev 10 cm; test at 5% level if population mean is 165 cm.',
    marks: 10,
    yearsAsked: [2022, 2024, 2025],
    repeatCount: 4,
    isHighProbability: true,
    expectedKeywords: ['Hypothesis Testing', 'Null Hypothesis', 'Alternative Hypothesis', 'Type I Error', 'Z Test', 'Rejection Region'],
    bullets: [
      'Hypothesis Testing Steps: 1. Formulate H0 and H1; 2. Choose significance level alpha; 3. Select test statistic; 4. Identify critical value region; 5. Formulate decision rule.',
      'Type I Error (alpha): Rejecting null hypothesis H0 when it is actually true. Type II Error (beta): Failing to reject H0 when it is false.',
      'Hypothesis Formulation: H0: mu = 165 cm vs H1: mu != 165 cm (Two-Tailed Test at alpha = 0.05).',
      'Test Statistic Calculation: Z = (X_bar - mu0) / (s / sqrt(n)) = (168 - 165) / (10 / sqrt(100)) = 3 / 1 = 3.0.',
      'Decision Rule: At alpha = 0.05, critical Z values are +-1.96. Since calculated Z = 3.0 > 1.96, it falls into the rejection region.',
      'Conclusion: Reject H0 at 5% significance level. The sample provides sufficient evidence that average student height is significantly different from 165 cm.'
    ],
    diagramFormulaTip: 'Draw a normal curve with rejection regions in both tails (2.5% each) beyond +-1.96, and plot calculated Z=3.0 deep in the right tail.',
    userStatus: 'not-started',
    bookmarked: true
  }
];

/**
 * Universal Syllabus Matcher:
 * Resolves standard 4-unit curriculum, 16-24 syllabus topics, and 8-12 PYQs for any subject.
 */
export function findStandardSyllabus(subjectNameOrCode?: string): {
  matchedSubject?: SubjectMeta;
  topics: SyllabusTopic[];
  questions: PYQQuestion[];
} {
  if (!subjectNameOrCode) {
    return { topics: [], questions: [] };
  }

  const query = subjectNameOrCode.toLowerCase().trim();

  // Match subject
  const matched = STANDARD_CS_SUBJECTS.find(s => {
    const sId = s.id.toLowerCase();
    const sName = s.name.toLowerCase();
    const sCode = (s.code || '').toLowerCase();
    return sId === query || sName.includes(query) || query.includes(sId) || (sCode && sCode.includes(query));
  });

  if (matched) {
    const sTopics = STANDARD_CS_TOPICS.filter(t => t.subjectId === matched.id);
    const sPyqs = STANDARD_CS_PYQS.filter(q => q.subjectId === matched.id);
    return { matchedSubject: matched, topics: sTopics, questions: sPyqs };
  }

  // Fallback: Check if partial match matches any of the canonical subjects
  if (query.includes('soft') || query.includes('engineer') || query === 'se') {
    return {
      matchedSubject: STANDARD_CS_SUBJECTS[0],
      topics: STANDARD_CS_TOPICS.filter(t => t.subjectId === 'se'),
      questions: STANDARD_CS_PYQS.filter(q => q.subjectId === 'se')
    };
  }
  if (query.includes('object') || query.includes('java') || query.includes('cpp') || query.includes('c++') || query === 'oop' || query === 'oopu') {
    return {
      matchedSubject: STANDARD_CS_SUBJECTS[1],
      topics: STANDARD_CS_TOPICS.filter(t => t.subjectId === 'oopu'),
      questions: STANDARD_CS_PYQS.filter(q => q.subjectId === 'oopu')
    };
  }
  if (query.includes('network') || query === 'cn' || query === 'cnse') {
    return {
      matchedSubject: STANDARD_CS_SUBJECTS[2],
      topics: STANDARD_CS_TOPICS.filter(t => t.subjectId === 'cn'),
      questions: STANDARD_CS_PYQS.filter(q => q.subjectId === 'cn')
    };
  }
  if (query.includes('prob') || query.includes('stat') || query === 'pas' || query.includes('math')) {
    return {
      matchedSubject: STANDARD_CS_SUBJECTS[3],
      topics: STANDARD_CS_TOPICS.filter(t => t.subjectId === 'pas'),
      questions: STANDARD_CS_PYQS.filter(q => q.subjectId === 'pas')
    };
  }
  if (query.includes('operat') || query === 'os') {
    return {
      matchedSubject: STANDARD_CS_SUBJECTS[4],
      topics: STANDARD_CS_TOPICS.filter(t => t.subjectId === 'os'),
      questions: STANDARD_CS_PYQS.filter(q => q.subjectId === 'os')
    };
  }
  if (query.includes('data') && (query.includes('base') || query === 'dbms' || query.includes('sql'))) {
    return {
      matchedSubject: STANDARD_CS_SUBJECTS[5],
      topics: STANDARD_CS_TOPICS.filter(t => t.subjectId === 'dbms'),
      questions: STANDARD_CS_PYQS.filter(q => q.subjectId === 'dbms')
    };
  }
  if (query.includes('struct') || query.includes('algo') || query === 'dsa') {
    return {
      matchedSubject: STANDARD_CS_SUBJECTS[6],
      topics: STANDARD_CS_TOPICS.filter(t => t.subjectId === 'dsa'),
      questions: STANDARD_CS_PYQS.filter(q => q.subjectId === 'dsa')
    };
  }

  return { topics: [], questions: [] };
}

export const STANDARD_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-se-cohesion',
    subjectId: 'se',
    topicTitle: 'Cohesion vs Coupling',
    front: 'What is the optimal combination of Cohesion and Coupling in software engineering modularity, and why?',
    back: 'High Cohesion and Low Coupling.\n\n• High Cohesion: Each module has a single, well-focused responsibility, making it self-contained, testable, and maintainable.\n• Low Coupling: Minimal dependencies between modules, preventing cascading bugs when changes are made.',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'fc-se-agile',
    subjectId: 'se',
    topicTitle: 'Agile vs Waterfall',
    front: 'Under what software project conditions is Agile strongly preferred over the classical Waterfall model?',
    back: 'Agile is preferred when:\n1. Requirements are volatile or actively evolving with user feedback.\n2. Fast time-to-market with Minimum Viable Product (MVP) sprints is required.\n3. Continuous stakeholder collaboration and cross-functional teams exist.\n(Waterfall is strictly reserved for fixed-scope, mission-critical, regulated systems like avionics or medical devices).',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'fc-oopu-poly',
    subjectId: 'oopu',
    topicTitle: 'Polymorphism',
    front: 'Explain the fundamental difference between Compile-Time and Run-Time Polymorphism with concrete examples.',
    back: '• Compile-Time (Static) Polymorphism: Resolved during compilation.\n  - Implemented via Method Overloading or Operator Overloading.\n  - Faster execution, zero runtime lookup overhead.\n\n• Run-Time (Dynamic) Polymorphism: Resolved during execution using dynamic dispatch (vptr/vtable).\n  - Implemented via Method Overriding with inheritance and virtual methods.',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'fc-oopu-solid',
    subjectId: 'oopu',
    topicTitle: 'SOLID Principles',
    front: 'Name all 5 SOLID Object-Oriented Design principles and summarize what each enforces.',
    back: 'S - Single Responsibility: A class should have only one reason to change.\nO - Open/Closed: Open for extension, closed for modification.\nL - Liskov Substitution: Subtypes must be substitutable for base types without altering correctness.\nI - Interface Segregation: Clients should not be forced to depend on interfaces they do not use.\nD - Dependency Inversion: Depend upon abstractions, not concretions.',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'fc-cn-tcp-udp',
    subjectId: 'cn',
    topicTitle: 'TCP vs UDP',
    front: 'Why is TCP called connection-oriented while UDP is connectionless? Contrast their headers and use cases.',
    back: '• TCP: Requires a 3-way handshake (SYN, SYN-ACK, ACK) before data transfer. Provides sequence numbers, ACKs, flow control (sliding window), and retransmissions. 20-byte minimum header. (HTTP/HTTPS, SSH, FTP).\n\n• UDP: Sends standalone datagrams with zero connection setup, no guaranteed ordering, and no congestion backoff. 8-byte header. Ideal for real-time latency-critical traffic (DNS, VoIP, live streaming, multiplayer games).',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'fc-cn-subnet',
    subjectId: 'cn',
    topicTitle: 'Subnetting & CIDR',
    front: 'Given the CIDR notation 192.168.10.0/26, determine: (1) Subnet Mask, (2) Total IPs, (3) Usable Hosts.',
    back: '1. Subnet Mask: /26 means 26 network bits -> 11111111.11111111.11111111.11000000 = 255.255.255.192\n2. Host Bits (h) = 32 - 26 = 6 bits\n3. Total IP addresses = 2^6 = 64\n4. Usable host count = 2^6 - 2 = 62 (reserving network address .0 and broadcast address .63).',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'fc-os-threads',
    subjectId: 'os',
    topicTitle: 'Processes vs Threads',
    front: 'What resources do multiple threads of the same process share, and what does each thread maintain privately?',
    back: '• Shared among threads of the same process:\n  - Code/Text segment\n  - Data & BSS segments (global variables)\n  - Heap (dynamically allocated memory)\n  - Open file descriptors and OS signals\n\n• Private to each thread:\n  - Thread ID (TID)\n  - Program Counter (PC)\n  - CPU Register set\n  - Thread Call Stack (local variables & activation frames).',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'fc-os-deadlock',
    subjectId: 'os',
    topicTitle: 'Deadlocks',
    front: 'State Coffman\'s 4 necessary conditions for Deadlock occurrence in an Operating System.',
    back: '1. Mutual Exclusion: At least one resource must be held in non-shareable mode.\n2. Hold and Wait: A process holds at least one resource while waiting to acquire additional resources held by others.\n3. No Preemption: Resources cannot be forcibly seized; only released voluntarily after task completion.\n4. Circular Wait: A closed chain of processes exists: P0 waits for P1, P1 waits for P2... Pn waits for P0.',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'fc-pas-bayes',
    subjectId: 'pas',
    topicTitle: 'Bayes Theorem',
    front: 'State Bayes\' Theorem formula and explain what each variable represents in Bayesian inference.',
    back: 'Formula: P(A|B) = [P(B|A) * P(A)] / P(B)\n\n• P(A|B): Posterior Probability (probability of hypothesis A given evidence B)\n• P(B|A): Likelihood (probability of evidence B occurring under hypothesis A)\n• P(A): Prior Probability (initial degree of belief in A before observing B)\n• P(B): Marginal Evidence / Normalizing Constant.',
    intervalStep: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  }
];
