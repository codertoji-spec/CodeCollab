import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import { io } from 'socket.io-client'
import * as Y from 'yjs'
import { MonacoBinding } from 'y-monaco'
import { useAuth } from '../context/AuthContext'
import VersionHistory from '../components/VersionHistory'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

const LANGUAGES = ['javascript', 'python', 'cpp', 'typescript']
const MONACO_LANG = {
  cpp: 'cpp', javascript: 'javascript', python: 'python',
  typescript: 'typescript',
}

const DEFAULT_CODE = {
  javascript: '// Welcome to CodeCollab!\nconsole.log("Hello, World!");\n',
  python: '# Welcome to CodeCollab!\nprint("Hello, World!")\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
  typescript: '// Welcome to CodeCollab!\nconsole.log("Hello, World!");\n',
}

const CURSOR_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6', '#f97316',
]

const CPP_SNIPPETS = [{ "title": "1. FCFS", "code": "#include <iostream>\n\n#include <vector>\n\n#include <climits>\n\nusing namespace std;\n\nstruct Process {\n\n       int pid;\n\n       int bt;   // Burst Time\n\n       int art;  // Arrival Time\n\n       int ct;   // Completion Time\n\n};\n\nvoid findCompletionTime(vector<Process>& proc, int n) {\n\n       vector<int> rt(n);\n\n       for (int i = 0; i < n; i++)\n\n           rt[i] = proc[i].bt;\n\n       int complete = 0, t = 0;\n\n       while (complete != n) {\n\n           int shortest = -1;\n\n           int minm = INT_MAX;\n\n           for (int j = 0; j < n; j++) {\n\n               if (proc[j].art <= t && rt[j] > 0 && rt[j] < minm) {\n\n                   minm = rt[j];\n\n                   shortest = j;\n\n               }\n\n           }\n\n           if (shortest == -1) {\n\n               t++;\n\n               continue;\n\n           }\n\n           t += rt[shortest];\n\n           rt[shortest] = 0;\n\n           proc[shortest].ct = t;\n\n           complete++;\n\n       }\n\n}\n\nvoid findTurnAroundTime(const vector<Process>& proc, int n, vector<int>& tat) {\n\n       for (int i = 0; i < n; i++)\n\n           tat[i] = proc[i].ct - proc[i].art;\n\n}\n\nvoid findWaitingTime(const vector<Process>& proc, int n,\n\n                        const vector<int>& tat, vector<int>& wt) {\n\n       for (int i = 0; i < n; i++)\n\n           wt[i] = tat[i] - proc[i].bt;\n\n}\n\nvoid findavgTime(vector<Process>& proc, int n) {\n\n       vector<int> wt(n), tat(n);\n\n       int total_wt = 0, total_tat = 0;\n\n       findCompletionTime(proc, n);\n\n       findTurnAroundTime(proc, n, tat);\n\n       findWaitingTime(proc, n, tat, wt);\n\n       cout << \"P  BT  AT  CT  TAT  WT\\n\";\n\n       for (int i = 0; i < n; i++) {\n\n           total_wt += wt[i];\n\n           total_tat += tat[i];\n\n           cout << proc[i].pid << \"  \"\n\n                << proc[i].bt << \"   \"\n\n                << proc[i].art << \"   \"\n\n                << proc[i].ct << \"   \"\n\n                << tat[i] << \"   \"\n\n                << wt[i] << \"\\n\";\n\n       }\n\n       cout << \"Average Waiting Time = \" << (float)total_wt / n << \"\\n\";\n\n       cout << \"Average Turnaround Time = \" << (float)total_tat / n << \"\\n\";\n\n}\n\nint main() {\n\n       // Hardcoded values instead of user input\n\n       vector<Process> proc = {\n\n           {1, 6, 1, 0},   // pid, burst time, arrival time\n\n           {2, 8, 1, 0},\n\n           {3, 7, 2, 0},\n\n           {4, 3, 3, 0}\n\n       };\n\n       int n = proc.size();\n\n       findavgTime(proc, n);\n\n       return 0;\n\n}" }, { "title": "2. SJF", "code": "#include <iostream>\n\n#include <vector>\n\n#include <climits>\n\nusing namespace std;\n\nstruct Process {\n\n       int bt;   // Burst Time\n\n       int art;  // Arrival Time\n\n};\n\nvoid findTurnAroundTime(const vector<Process>& proc, int n,\n\n                           const vector<int>& wt, vector<int>& tat) {\n\n       for (int i = 0; i < n; i++)\n\n           tat[i] = proc[i].bt + wt[i];\n\n}\n\nvoid findWaitingTime(const vector<Process>& proc, int n,\n\n                        vector<int>& wt, vector<int>& ct) {\n\n       int t = 0, completedCount = 0;\n\n       vector<bool> completed(n, false);\n\n       while (completedCount < n) {\n\n           int idx = -1;\n\n           int minBurstTime = INT_MAX;\n\n           for (int i = 0; i < n; i++) {\n\n               if (!completed[i] && proc[i].art <= t &&\n\n                   proc[i].bt < minBurstTime) {\n\n                   minBurstTime = proc[i].bt;\n\n                   idx = i;\n\n               }\n\n           }\n\n           if (idx == -1) {\n\n               t++;\n\n               continue;\n\n           }\n\n           t += proc[idx].bt;\n\n           ct[idx] = t;\n\n           wt[idx] = ct[idx] - proc[idx].bt - proc[idx].art;\n\n           if (wt[idx] < 0) wt[idx] = 0;\n\n           completed[idx] = true;\n\n           completedCount++;\n\n       }\n\n}\n\nvoid findavgTime(vector<Process>& proc, int n) {\n\n       vector<int> wt(n), tat(n), ct(n);\n\n       int total_wt = 0, total_tat = 0;\n\n       findWaitingTime(proc, n, wt, ct);\n\n       findTurnAroundTime(proc, n, wt, tat);\n\n       cout << \"BT AT CT WT TAT\\n\";\n\n       for (int i = 0; i < n; i++) {\n\n           total_wt += wt[i];\n\n           total_tat += tat[i];\n\n           cout << proc[i].bt << \" \"\n\n                << proc[i].art << \" \"\n\n                << ct[i] << \" \"\n\n                << wt[i] << \" \"\n\n                << tat[i] << \"\\n\";\n\n       }\n\n       cout << \"Average Waiting Time = \" << (float)total_wt / n << \"\\n\";\n\n       cout << \"Average Turnaround Time = \" << (float)total_tat / n << \"\\n\";\n\n}\n\nint main() {\n\n       // Hardcoded process values (BT, AT)\n\n       vector<Process> proc = {\n\n           {6, 1},   // Burst=6, Arrival=1\n\n           {8, 1},   // Burst=8, Arrival=1\n\n           {7, 2},   // Burst=7, Arrival=2\n\n           {3, 3}    // Burst=3, Arrival=3\n\n       };\n\n       int n = proc.size();\n\n       findavgTime(proc, n);\n\n       return 0;\n\n}" }, { "title": "3. PRIORITY", "code": "#include <iostream>\n\n#include <vector>\n\nusing namespace std;\n\nstruct Process {\n\n       int id, at, bt, prio, ct, tat, wt;\n\n};\n\nint main() {\n\n       int n = 4;\n\n       vector<Process> p(n);\n\n       vector<bool> done(n, false);\n\n       int arrival[]  = {0, 1, 2, 3};\n\n       int burst[]    = {5, 3, 8, 6};\n\n       int priority[] = {2, 1, 4, 3};\n\n       for (int i = 0; i < n; i++) {\n\n           p[i].id   = i + 1;\n\n           p[i].at   = arrival[i];\n\n           p[i].bt   = burst[i];\n\n           p[i].prio = priority[i];\n\n       }\n\n       int completed = 0, time = 0;\n\n       while (completed < n) {\n\n           int idx = -1;\n\n           int bestPrio = 1e9;\n\n           for (int i = 0; i < n; i++) {\n\n               if (!done[i] && p[i].at <= time) {\n\n                   if (p[i].prio < bestPrio) {\n\n                       bestPrio = p[i].prio;\n\n                       idx = i;\n\n                   }\n\n               }\n\n           }\n\n           if (idx == -1) { time++; continue; }\n\n           time += p[idx].bt;\n\n           p[idx].ct  = time;\n\n           p[idx].tat = p[idx].ct - p[idx].at;\n\n           p[idx].wt  = p[idx].tat - p[idx].bt;\n\n           done[idx]  = true;\n\n           completed++;\n\n       }\n\n       cout << \"Process\\tAT\\tBT\\tPriority\\tCT\\tTAT\\tWT\\n\";\n\n       for (int i = 0; i < n; i++) {\n\n           cout << \"P\" << p[i].id << \"\\t\" << p[i].at << \"\\t\" << p[i].bt << \"\\t\"\n\n                << p[i].prio << \"\\t\\t\" << p[i].ct << \"\\t\" << p[i].tat << \"\\t\" << p[i].wt << \"\\n\";\n\n       }\n\n       float avgTAT = 0, avgWT = 0;\n\n       for (int i = 0; i < n; i++) { avgTAT += p[i].tat; avgWT += p[i].wt; }\n\n       cout << \"\\nAverage Turnaround Time: \" << avgTAT / n;\n\n       cout << \"\\nAverage Waiting Time: \" << avgWT / n << endl;\n\n       return 0;\n\n}" }, { "title": "4. RR", "code": "#include <iostream>\n\n#include <vector>\n\n#include <queue>\n\n#include <algorithm>\n\nusing namespace std;\n\nstruct Process {\n\n       int pid, at, bt, rt, ct;\n\n};\n\nbool compareArrival(const Process& a, const Process& b) { return a.at < b.at; }\n\nint main() {\n\n       int n = 4, quantum = 3;\n\n       vector<Process> p = {\n\n           {1, 0, 5, 5, 0}, {2, 1, 4, 4, 0}, {3, 2, 6, 6, 0}, {4, 3, 3, 3, 0}\n\n       };\n\n       sort(p.begin(), p.end(), compareArrival);\n\n       queue<int> q;\n\n       vector<bool> inQueue(n, false);\n\n       int time = p[0].at;\n\n       q.push(0); inQueue[0] = true;\n\n       while (!q.empty()) {\n\n           int i = q.front(); q.pop();\n\n           int exec = min(quantum, p[i].rt);\n\n           p[i].rt -= exec; time += exec;\n\n           for (int j = 0; j < n; j++)\n\n               if (!inQueue[j] && p[j].at <= time) { q.push(j); inQueue[j] = true; }\n\n           if (p[i].rt > 0) q.push(i);\n\n           else p[i].ct = time;\n\n           if (q.empty())\n\n               for (int j = 0; j < n; j++)\n\n                   if (!inQueue[j]) { time = p[j].at; q.push(j); inQueue[j] = true; break; }\n\n       }\n\n       double totalTAT = 0, totalWT = 0;\n\n       cout << \"PID\\tAT\\tBT\\tCT\\tTAT\\tWT\\n\";\n\n       for (int i = 0; i < n; i++) {\n\n           int tat = p[i].ct - p[i].at, wt = tat - p[i].bt;\n\n           totalTAT += tat; totalWT += wt;\n\n           cout << \"P\" << p[i].pid << \"\\t\" << p[i].at << \"\\t\" << p[i].bt << \"\\t\"\n\n                << p[i].ct << \"\\t\" << tat << \"\\t\" << wt << \"\\n\";\n\n       }\n\n       cout << \"\\nAverage TAT: \" << totalTAT/n << \"  WT: \" << totalWT/n << endl;\n\n       return 0;\n\n}" }, { "title": "5. SRTF", "code": "#include <iostream>\n\n#include <vector>\n\n#include <climits>\n\nusing namespace std;\n\nstruct Process {\n\n       int pid, arrival, burst, remaining, completion, waiting, turnaround;\n\n};\n\nint main() {\n\n       int n = 4;\n\n       vector<Process> p = {\n\n           {1,0,8,8,0,0,0},{2,1,4,4,0,0,0},{3,2,9,9,0,0,0},{4,3,5,5,0,0,0}\n\n       };\n\n       int completed = 0, current_time = 0, min_remaining, shortest;\n\n       bool found;\n\n       while (completed < n) {\n\n           min_remaining = INT_MAX; found = false;\n\n           for (int i = 0; i < n; i++)\n\n               if (p[i].arrival <= current_time && p[i].remaining > 0 && p[i].remaining < min_remaining)\n\n                   { min_remaining = p[i].remaining; shortest = i; found = true; }\n\n           if (!found) { current_time++; continue; }\n\n           p[shortest].remaining--; current_time++;\n\n           if (p[shortest].remaining == 0) {\n\n               completed++;\n\n               p[shortest].completion = current_time;\n\n               p[shortest].turnaround = p[shortest].completion - p[shortest].arrival;\n\n               p[shortest].waiting = p[shortest].turnaround - p[shortest].burst;\n\n           }\n\n       }\n\n       double totalWT = 0, totalTAT = 0;\n\n       cout << \"PID\\tAT\\tBT\\tCT\\tWT\\tTAT\\n\";\n\n       for (int i = 0; i < n; i++) {\n\n           totalWT += p[i].waiting; totalTAT += p[i].turnaround;\n\n           cout << \"P\" << p[i].pid << \"\\t\" << p[i].arrival << \"\\t\" << p[i].burst << \"\\t\"\n\n                << p[i].completion << \"\\t\" << p[i].waiting << \"\\t\" << p[i].turnaround << \"\\n\";\n\n       }\n\n       cout << \"\\nAvg WT: \" << totalWT/n << \"  TAT: \" << totalTAT/n << endl;\n\n       return 0;\n\n}" }, { "title": "6. LRTF", "code": "#include <iostream>\n\n#include <vector>\n\nusing namespace std;\n\nint main() {\n\n       int n = 4;\n\n       vector<int> bt = {5, 7, 3, 6};\n\n       vector<int> rt(n), wt(n, 0), tat(n, 0);\n\n       for (int i = 0; i < n; i++) rt[i] = bt[i];\n\n       int time = 0, completed = 0;\n\n       while (completed < n) {\n\n           int max_idx = -1, max_val = -1;\n\n           for (int i = 0; i < n; i++)\n\n               if (rt[i] > max_val && rt[i] > 0) { max_val = rt[i]; max_idx = i; }\n\n           if (max_idx == -1) { time++; continue; }\n\n           rt[max_idx]--; time++;\n\n           if (rt[max_idx] == 0) {\n\n               completed++;\n\n               tat[max_idx] = time;\n\n               wt[max_idx] = tat[max_idx] - bt[max_idx];\n\n           }\n\n       }\n\n       cout << \"PID\\tBT\\tWT\\tTAT\\n\";\n\n       double totalWT = 0, totalTAT = 0;\n\n       for (int i = 0; i < n; i++) {\n\n           cout << \"P\" << i+1 << \"\\t\" << bt[i] << \"\\t\" << wt[i] << \"\\t\" << tat[i] << \"\\n\";\n\n           totalWT += wt[i]; totalTAT += tat[i];\n\n       }\n\n       cout << \"\\nAvg WT: \" << totalWT/n << \"  TAT: \" << totalTAT/n << endl;\n\n       return 0;\n\n}" }, { "title": "7. BANKER", "code": "#include <iostream>\n\nusing namespace std;\n\nint main() {\n\n       int n = 5, m = 3;\n\n       int alloc[5][3] = { {0,1,0},{2,0,0},{3,0,2},{2,1,1},{0,0,2} };\n\n       int maxm[5][3]  = { {7,5,3},{3,2,2},{9,0,2},{2,2,2},{4,3,3} };\n\n       int avail[3]    = {3,3,2};\n\n       int f[5]={0}, ans[5], ind=0;\n\n       int need[5][3];\n\n       for(int i=0;i<n;i++) for(int j=0;j<m;j++) need[i][j]=maxm[i][j]-alloc[i][j];\n\n       for(int k=0;k<n;k++) for(int i=0;i<n;i++) if(!f[i]) {\n\n           int flag=0;\n\n           for(int j=0;j<m;j++) if(need[i][j]>avail[j]){flag=1;break;}\n\n           if(!flag){ans[ind++]=i;for(int y=0;y<m;y++)avail[y]+=alloc[i][y];f[i]=1;}\n\n       }\n\n       bool safe=true;\n\n       for(int i=0;i<n;i++) if(!f[i]) safe=false;\n\n       if(safe){cout<<\"Safe Sequence: \";for(int i=0;i<n-1;i++)cout<<\"P\"<<ans[i]<<\" -> \";cout<<\"P\"<<ans[n-1]<<endl;}\n\n       else cout<<\"Unsafe State\"<<endl;\n\n       return 0;\n\n}" }, { "title": "8. PCP", "code": "#include <iostream>\n\n#include <queue>\n\nusing namespace std;\n\nint main() {\n\n       queue<int> buffer;\n\n       int maxSize = 5, item = 1;\n\n       for (int i = 0; i < 7; i++) {\n\n           if ((int)buffer.size() < maxSize) { buffer.push(item); cout << \"Produced \" << item++ << \"\\n\"; }\n\n           else cout << \"Buffer Full\\n\";\n\n       }\n\n       for (int i = 0; i < 7; i++) {\n\n           if (!buffer.empty()) { cout << \"Consumed \" << buffer.front() << \"\\n\"; buffer.pop(); }\n\n           else cout << \"Buffer Empty\\n\";\n\n       }\n\n       return 0;\n\n}" }, { "title": "9. FIFO PAGE", "code": "#include <iostream>\n\n#include <vector>\n\nusing namespace std;\n\nint main() {\n\n       vector<int> pages = {1,2,3,4,5};\n\n       int n = pages.size(), frames = 3;\n\n       vector<int> frame(frames, -1);\n\n       int index = 0, pageFaults = 0;\n\n       for (int i = 0; i < n; i++) {\n\n           bool hit = false;\n\n           for (int j = 0; j < frames; j++) if (frame[j]==pages[i]){hit=true;break;}\n\n           if (!hit) { frame[index]=pages[i]; index=(index+1)%frames; pageFaults++; }\n\n       }\n\n       cout << \"Total Page Faults: \" << pageFaults << endl;\n\n       return 0;\n\n}" }, { "title": "10. LRU PAGE", "code": "#include <iostream>\n\n#include <vector>\n\nusing namespace std;\n\nint findLRU(vector<int>& lastUsed, int n) {\n\n       int minIdx = 0;\n\n       for (int i = 1; i < n; i++) if (lastUsed[i] < lastUsed[minIdx]) minIdx = i;\n\n       return minIdx;\n\n}\n\nint main() {\n\n       vector<int> pages = {1,2,3,4,1,2,5,1,2,3,4,5};\n\n       int n = pages.size(), frames = 3;\n\n       vector<int> frame(frames,-1), lastUsed(frames,0);\n\n       int pageFaults = 0, time = 0;\n\n       for (int i = 0; i < n; i++) {\n\n           bool hit = false;\n\n           for (int j = 0; j < frames; j++) if (frame[j]==pages[i]){hit=true;lastUsed[j]=time;break;}\n\n           if (!hit) {\n\n               int pos = -1;\n\n               for (int j = 0; j < frames; j++) if (frame[j]==-1){pos=j;break;}\n\n               if (pos==-1) pos = findLRU(lastUsed, frames);\n\n               frame[pos]=pages[i]; lastUsed[pos]=time; pageFaults++;\n\n           }\n\n           time++;\n\n       }\n\n       cout << \"Total Page Faults: \" << pageFaults << endl;\n\n       return 0;\n\n}" }, { "title": "10. DPP", "code": "#include <iostream>\n\n#include <thread>\n\n#include <mutex>\n\n#include <chrono>\n\nusing namespace std;\n\nmutex chopsticks[5];\n\nvoid philosopher(int id) {\n\n       int left = id, right = (id+1)%5;\n\n       if (id==4) { chopsticks[right].lock(); chopsticks[left].lock(); }\n\n       else { chopsticks[left].lock(); chopsticks[right].lock(); }\n\n       cout << id << \" EATING\\n\";\n\n       this_thread::sleep_for(chrono::milliseconds(500));\n\n       chopsticks[left].unlock(); chopsticks[right].unlock();\n\n}\n\nint main() {\n\n       thread p[5];\n\n       for (int i = 0; i < 5; i++) p[i] = thread(philosopher, i);\n\n       for (int i = 0; i < 5; i++) p[i].join();\n\n       return 0;\n\n}" }, { "title": "11. RWP", "code": "#include <iostream>\n\n#include <thread>\n\n#include <semaphore.h>\n\nusing namespace std;\n\nsem_t wrt, mutex_sem;\n\nint readCount = 0;\n\nvoid reader(int id) {\n\n       sem_wait(&mutex_sem); readCount++;\n\n       if (readCount==1) sem_wait(&wrt);\n\n       sem_post(&mutex_sem);\n\n       cout << \"Reader \" << id << \" is reading\\n\";\n\n       sem_wait(&mutex_sem); readCount--;\n\n       if (readCount==0) sem_post(&wrt);\n\n       sem_post(&mutex_sem);\n\n}\n\nvoid writer(int id) {\n\n       sem_wait(&wrt);\n\n       cout << \"Writer \" << id << \" is writing\\n\";\n\n       sem_post(&wrt);\n\n}\n\nint main() {\n\n       sem_init(&wrt,0,1); sem_init(&mutex_sem,0,1);\n\n       thread r1(reader,1),r2(reader,2),r3(reader,3);\n\n       thread w1(writer,1),w2(writer,2);\n\n       r1.join();r2.join();r3.join();w1.join();w2.join();\n\n       sem_destroy(&wrt); sem_destroy(&mutex_sem);\n\n       return 0;\n\n}" }, { "title": "12. SSTF", "code": "#include <iostream>\n\n#include <vector>\n\n#include <cmath>\n\n#include <climits>\n\nusing namespace std;\n\nint main() {\n\n       vector<int> request = {176,79,34,60,92};\n\n       int head = 50, n = request.size();\n\n       vector<bool> visited(n, false);\n\n       int totalSeekTime = 0;\n\n       cout << \"Seek Sequence: \" << head;\n\n       for (int i = 0; i < n; i++) {\n\n           int minDist = INT_MAX, index = -1;\n\n           for (int j = 0; j < n; j++)\n\n               if (!visited[j] && abs(request[j]-head)<minDist) { minDist=abs(request[j]-head); index=j; }\n\n           visited[index]=true; totalSeekTime+=minDist; head=request[index];\n\n           cout << \" -> \" << head;\n\n       }\n\n       cout << \"\\n\\nTotal Seek Time: \" << totalSeekTime << endl;\n\n       return 0;\n\n}" }, { "title": "13. FCFS (DISK)", "code": "#include <iostream>\n\n#include <vector>\n\n#include <cmath>\n\nusing namespace std;\n\nint main() {\n\n       vector<int> request = {176,79,34,60,92};\n\n       int head = 50, totalSeekTime = 0;\n\n       cout << \"Seek Sequence: \" << head;\n\n       for (int r : request) {\n\n           totalSeekTime += abs(r - head);\n\n           head = r;\n\n           cout << \" -> \" << head;\n\n       }\n\n       cout << \"\\n\\nTotal Seek Time: \" << totalSeekTime << endl;\n\n       return 0;\n\n}" }, { "title": "14. C SCAN", "code": "#include <iostream>\n\n#include <vector>\n\n#include <algorithm>\n\n#include <cmath>\n\nusing namespace std;\n\nint main() {\n\n       vector<int> request = {176,79,34,60,92};\n\n       int head = 50, disk_size = 200, direction = 1;\n\n       vector<int> left, right;\n\n       for (int r : request) {\n\n           if (r < head) left.push_back(r);\n\n           else right.push_back(r);\n\n       }\n\n       if (direction==0) left.push_back(0);\n\n       else right.push_back(disk_size-1);\n\n       sort(left.begin(),left.end());\n\n       sort(right.begin(),right.end());\n\n       int totalSeekTime = 0;\n\n       cout << \"Seek Sequence: \" << head;\n\n       if (direction==1) {\n\n           for (int r : right) { totalSeekTime+=abs(r-head); head=r; cout<<\" -> \"<<head; }\n\n           for (int r : left)  { totalSeekTime+=abs(r-head); head=r; cout<<\" -> \"<<head; }\n\n       } else {\n\n           for (int i=left.size()-1;i>=0;i--) { totalSeekTime+=abs(left[i]-head); head=left[i]; cout<<\" -> \"<<head; }\n\n           for (int r : right) { totalSeekTime+=abs(r-head); head=r; cout<<\" -> \"<<head; }\n\n       }\n\n       cout << \"\\n\\nTotal Seek Time: \" << totalSeekTime << endl;\n\n       return 0;\n\n}" }, { "title": "15. IMRR", "code": "#include <iostream>\n\n#include <vector>\n\n#include <queue>\n\nusing namespace std;\n\nstruct Process { int id,at,bt,rt,ct,tat,wt; };\n\nint main() {\n\n       int n = 3;\n\n       vector<Process> p = {\n\n           {1,0,5,5,0,0,0},{2,1,3,3,0,0,0},{3,2,8,8,0,0,0}\n\n       };\n\n       int time=0,completed=0;\n\n       queue<int> q;\n\n       vector<bool> inQueue(n,false);\n\n       while (completed < n) {\n\n           for(int i=0;i<n;i++) if(p[i].at<=time&&!inQueue[i]&&p[i].rt>0){q.push(i);inQueue[i]=true;}\n\n           if(q.empty()){time++;continue;}\n\n           int size=q.size(),sum=0;\n\n           queue<int> temp=q;\n\n           while(!temp.empty()){sum+=p[temp.front()].rt;temp.pop();}\n\n           int tq=max(1,sum/size);\n\n           int i=q.front();q.pop();\n\n           if(p[i].rt>tq){time+=tq;p[i].rt-=tq;}\n\n           else{time+=p[i].rt;p[i].rt=0;p[i].ct=time;completed++;}\n\n           for(int j=0;j<n;j++) if(p[j].at<=time&&!inQueue[j]&&p[j].rt>0){q.push(j);inQueue[j]=true;}\n\n           if(p[i].rt>0) q.push(i);\n\n       }\n\n       cout<<\"Process\\tAT\\tBT\\tCT\\tTAT\\tWT\\n\";\n\n       for(int i=0;i<n;i++){\n\n           p[i].tat=p[i].ct-p[i].at; p[i].wt=p[i].tat-p[i].bt;\n\n           cout<<\"P\"<<p[i].id<<\"\\t\"<<p[i].at<<\"\\t\"<<p[i].bt<<\"\\t\"<<p[i].ct<<\"\\t\"<<p[i].tat<<\"\\t\"<<p[i].wt<<\"\\n\";\n\n       }\n\n       return 0;\n\n}" }, { "title": "16. HRNN", "code": "#include <iostream>\n\n#include <vector>\n\nusing namespace std;\n\nstruct Process { int pid,at,bt,ct,wt,tat; bool done; };\n\nint main() {\n\n       int n=3;\n\n       vector<Process> p={{1,0,4,0,0,0,false},{2,1,3,0,0,0,false},{3,2,5,0,0,0,false}};\n\n       int completed=0,time=0;\n\n       double total_wt=0,total_tat=0;\n\n       while(completed<n){\n\n           int idx=-1; double max_rr=-1.0;\n\n           for(int i=0;i<n;i++) if(!p[i].done&&p[i].at<=time){\n\n               double rr=(double)(time-p[i].at+p[i].bt)/p[i].bt;\n\n               if(rr>max_rr){max_rr=rr;idx=i;}\n\n           }\n\n           if(idx==-1){time++;continue;}\n\n           time+=p[idx].bt; p[idx].ct=time;\n\n           p[idx].tat=p[idx].ct-p[idx].at; p[idx].wt=p[idx].tat-p[idx].bt;\n\n           total_wt+=p[idx].wt; total_tat+=p[idx].tat;\n\n           p[idx].done=true; completed++;\n\n       }\n\n       cout<<\"PID\\tAT\\tBT\\tWT\\tTAT\\tCT\\n\";\n\n       for(int i=0;i<n;i++) cout<<p[i].pid<<\"\\t\"<<p[i].at<<\"\\t\"<<p[i].bt<<\"\\t\"<<p[i].wt<<\"\\t\"<<p[i].tat<<\"\\t\"<<p[i].ct<<\"\\n\";\n\n       cout<<\"\\nAvg WT: \"<<total_wt/n<<\"  TAT: \"<<total_tat/n<<endl;\n\n       return 0;\n\n}" }, { "title": "17. CSP", "code": "#include <iostream>\n\n#include <thread>\n\n#include <mutex>\n\n#include <condition_variable>\n\n#include <random>\n\nusing namespace std;\n\nconstexpr int NUM_ITERATIONS = 10;\n\nenum Resource { MATCH=1, PAPER=2, TOBACCO=4 };\n\nmutex mtx;\n\ncondition_variable cv_match,cv_paper,cv_tobacco,cv_smoke,cv_mp,cv_pt,cv_mt;\n\nint sum=0, signal_count[5]={0}, smoke_count[5]={0};\n\nvoid try_wake_up_smoker(){\n\n       if(sum==MATCH+PAPER){cv_mp.notify_one();sum=0;}\n\n       else if(sum==PAPER+TOBACCO){cv_pt.notify_one();sum=0;}\n\n       else if(sum==MATCH+TOBACCO){cv_mt.notify_one();sum=0;}\n\n}\n\nvoid agent(){\n\n       int choices[]={MATCH|PAPER,MATCH|TOBACCO,PAPER|TOBACCO};\n\n       int matching[]={TOBACCO,PAPER,MATCH};\n\n       mt19937 gen(random_device{}());\n\n       uniform_int_distribution<int> dist(0,2);\n\n       unique_lock<mutex> lock(mtx);\n\n       for(int i=0;i<NUM_ITERATIONS;i++){\n\n           int r=dist(gen); signal_count[matching[r]]++; int c=choices[r];\n\n           if(c&MATCH) cv_match.notify_one();\n\n           if(c&PAPER) cv_paper.notify_one();\n\n           if(c&TOBACCO) cv_tobacco.notify_one();\n\n           cv_smoke.wait(lock);\n\n       }\n\n}\n\nvoid match_listener(){unique_lock<mutex> lock(mtx);while(true){cv_match.wait(lock);sum+=MATCH;try_wake_up_smoker();}}\n\nvoid paper_listener(){unique_lock<mutex> lock(mtx);while(true){cv_paper.wait(lock);sum+=PAPER;try_wake_up_smoker();}}\n\nvoid tobacco_listener(){unique_lock<mutex> lock(mtx);while(true){cv_tobacco.wait(lock);sum+=TOBACCO;try_wake_up_smoker();}}\n\nvoid smoker_match(){unique_lock<mutex> lock(mtx);while(true){cv_pt.wait(lock);smoke_count[MATCH]++;cv_smoke.notify_one();}}\n\nvoid smoker_paper(){unique_lock<mutex> lock(mtx);while(true){cv_mt.wait(lock);smoke_count[PAPER]++;cv_smoke.notify_one();}}\n\nvoid smoker_tobacco(){unique_lock<mutex> lock(mtx);while(true){cv_mp.wait(lock);smoke_count[TOBACCO]++;cv_smoke.notify_one();}}\n\nint main(){\n\n       thread t1(match_listener),t2(paper_listener),t3(tobacco_listener);\n\n       thread s1(smoker_match),s2(smoker_paper),s3(smoker_tobacco);\n\n       thread a(agent); a.join();\n\n       t1.detach();t2.detach();t3.detach();s1.detach();s2.detach();s3.detach();\n\n       cout<<\"Smoke counts (after \"<<NUM_ITERATIONS<<\" iterations):\\n\";\n\n       cout<<\"Match   : \"<<smoke_count[MATCH]<<endl;\n\n       cout<<\"Paper   : \"<<smoke_count[PAPER]<<endl;\n\n       cout<<\"Tobacco : \"<<smoke_count[TOBACCO]<<endl;\n\n       return 0;\n\n}" }, { "title": "18. SBP", "code": "#include <iostream>\n\n#include <thread>\n\n#include <mutex>\n\n#include <condition_variable>\n\n#include <queue>\n\n#include <chrono>\n\nusing namespace std;\n\nint chairs=3, total_customers=5, served=0, left_customers=0;\n\nqueue<int> waiting_room;\n\nmutex mtx;\n\ncondition_variable barber_sleep, customer_wait;\n\nvoid barber(){\n\n       while(true){\n\n           unique_lock<mutex> lock(mtx);\n\n           while(waiting_room.empty()&&served+left_customers<total_customers) barber_sleep.wait(lock);\n\n           if(served+left_customers>=total_customers) break;\n\n           int id=waiting_room.front(); waiting_room.pop();\n\n           customer_wait.notify_one(); lock.unlock();\n\n           this_thread::sleep_for(chrono::milliseconds(200));\n\n           cout<<\"Barber served customer \"<<id<<endl; served++;\n\n       }\n\n}\n\nvoid customer(int id){\n\n       unique_lock<mutex> lock(mtx);\n\n       if((int)waiting_room.size()<chairs){\n\n           waiting_room.push(id);\n\n           cout<<\"Customer \"<<id<<\" is waiting\\n\";\n\n           barber_sleep.notify_one(); customer_wait.wait(lock);\n\n       } else { cout<<\"Customer \"<<id<<\" left (no chair)\\n\"; left_customers++; }\n\n}\n\nint main(){\n\n       thread barber_thread(barber);\n\n       vector<thread> customers;\n\n       for(int i=1;i<=total_customers;i++){\n\n           customers.emplace_back(customer,i);\n\n           this_thread::sleep_for(chrono::milliseconds(100));\n\n       }\n\n       for(auto& c:customers) c.join();\n\n       barber_sleep.notify_one(); barber_thread.join();\n\n       cout<<\"\\nSummary\\nServed: \"<<served<<\"\\nLeft: \"<<left_customers<<endl;\n\n       return 0;\n\n}" }]

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('cc_token')}` })

// ─── Cursor CSS helpers ────────────────────────────────────────────────────────
const injectedStyles = new Set()

function injectCursorStyle(socketId, color, username) {
  const safe = socketId.replace(/[^a-zA-Z0-9]/g, '_')
  const styleId = `cc-cursor-${safe}`
  document.getElementById(styleId)?.remove()
  injectedStyles.delete(socketId)
  injectedStyles.add(socketId)
  const style = document.createElement('style')
  style.id = styleId
  style.innerHTML = `
    .cc-cursor-${safe} {
      border-left: 2px solid ${color} !important;
      position: relative !important;
    }
    .cc-cursor-${safe}::before {
      content: "${username.replace(/"/g, '')}";
      position: absolute; top: -17px; left: -2px;
      background: ${color}; color: #fff;
      font-size: 10px; font-family: 'Space Grotesk', system-ui, sans-serif;
      font-weight: 600; padding: 1px 6px 2px;
      border-radius: 3px 3px 3px 0px;
      white-space: nowrap; line-height: 1.5;
      pointer-events: none; z-index: 9999;
      letter-spacing: 0.02em;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
    .cc-selection-${safe} { background: ${color}30 !important; }
  `
  document.head.appendChild(style)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Room() {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const initialState = location.state || {}
  const [room] = useState(initialState.room || { id: roomId, name: 'Room', language: 'javascript' })
  const [role] = useState(initialState.role || 'viewer')
  const isEditor = role === 'editor'

  // ── UI state ──────────────────────────────────────────────────────────────
  const [language, setLanguage] = useState(room.language || 'javascript')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [typingUsers, setTypingUsers] = useState([])
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [copied, setCopied] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [socketError, setSocketError] = useState(null)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const socketRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const ydocRef = useRef(null)
  const yjsBindingRef = useRef(null)
  const cursorsRef = useRef({})
  const colorMapRef = useRef({})
  const colorCounterRef = useRef(0)
  const typingTimeout = useRef(null)
  const chatEndRef = useRef(null)

  // ── Helpers ───────────────────────────────────────────────────────────────
  /**
   * Get current editor code from Yjs doc (source of truth).
   * No window global — passed as prop to VersionHistory instead.
   */
  const getCode = useCallback(
    () => ydocRef.current?.getText('monaco').toString() ?? editorRef.current?.getValue() ?? '',
    []
  )

  /** Replace Y.Doc content — triggers CRDT sync to all peers. */
  const setYjsCode = useCallback((code) => {
    const ydoc = ydocRef.current
    if (!ydoc) return
    const ytext = ydoc.getText('monaco')
    ydoc.transact(() => {
      ytext.delete(0, ytext.length)
      ytext.insert(0, code)
    })
  }, [])

  const getColorForSocket = useCallback((socketId) => {
    if (colorMapRef.current[socketId] === undefined) {
      colorMapRef.current[socketId] = colorCounterRef.current % CURSOR_COLORS.length
      colorCounterRef.current++
    }
    return CURSOR_COLORS[colorMapRef.current[socketId]]
  }, [])

  const removeCursor = useCallback((socketId) => {
    const entry = cursorsRef.current[socketId]
    if (!entry || !editorRef.current) return
    try { editorRef.current.deltaDecorations(entry.decorIds, []) } catch (_) { }
    delete cursorsRef.current[socketId]
    const safe = socketId.replace(/[^a-zA-Z0-9]/g, '_')
    document.getElementById(`cc-cursor-${safe}`)?.remove()
    injectedStyles.delete(socketId)
  }, [])

  const updateCursor = useCallback((socketId, username, position, selection) => {
    if (!editorRef.current || !monacoRef.current) return
    const editor = editorRef.current
    const monaco = monacoRef.current
    const color = getColorForSocket(socketId)
    const safe = socketId.replace(/[^a-zA-Z0-9]/g, '_')
    injectCursorStyle(socketId, color, username)
    const existing = cursorsRef.current[socketId]?.decorIds || []
    const decorations = [
      {
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        options: {
          className: `cc-cursor-${safe}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          zIndex: 10,
        },
      },
    ]
    if (
      selection &&
      !(selection.startLineNumber === selection.endLineNumber &&
        selection.startColumn === selection.endColumn)
    ) {
      decorations.push({
        range: new monaco.Range(
          selection.startLineNumber, selection.startColumn,
          selection.endLineNumber, selection.endColumn
        ),
        options: {
          className: `cc-selection-${safe}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })
    }
    cursorsRef.current[socketId] = {
      decorIds: editor.deltaDecorations(existing, decorations), color,
    }
  }, [getColorForSocket])

  // ── Socket + Yjs setup ────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('cc_token')

    // Pass JWT in socket handshake auth — verified server-side, never trust client userId
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },          // ← server middleware reads this
    })
    socketRef.current = socket

    socket.on('connect_error', (err) => {
      // AUTH_MISSING / AUTH_INVALID → redirect to login
      if (err.message?.startsWith('AUTH_')) {
        setSocketError('Session expired. Redirecting to login…')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setSocketError(`Connection error: ${err.message}`)
      }
    })

    // ── Yjs document ──────────────────────────────────────────────────────
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    const ytext = ydoc.getText('monaco')

    ydoc.on('update', (update, origin) => {
      if (origin === 'remote') return
      if (!isEditor) return
      socket.emit('yjs-update', { roomId, update })
    })

    // ── Socket events ─────────────────────────────────────────────────────
    socket.on('connect', () => {
      setSocketError(null)
      // Only send role — server derives userId/username from JWT
      socket.emit('join-room', { roomId, role, language })
    })

    const toUint8 = (data) => {
      if (data instanceof Uint8Array) return data
      if (data instanceof ArrayBuffer) return new Uint8Array(data)
      if (data && data.buffer instanceof ArrayBuffer) return new Uint8Array(data.buffer)
      if (Array.isArray(data)) return new Uint8Array(data)
      return new Uint8Array()
    }

    socket.on('yjs-init', (state) => {
      const bytes = toUint8(state)
      if (bytes.length > 0) Y.applyUpdate(ydoc, bytes, 'remote')

      if (isEditor && ytext.length === 0) {
        ydoc.transact(() => ytext.insert(0, DEFAULT_CODE[language] || ''), 'remote-init-skip')
      }

      if (editorRef.current) {
        yjsBindingRef.current?.destroy()
        yjsBindingRef.current = new MonacoBinding(
          ytext, editorRef.current.getModel(), new Set([editorRef.current])
        )
      }
    })

    socket.on('yjs-update', ({ update }) => {
      const bytes = toUint8(update)
      if (bytes.length > 0) Y.applyUpdate(ydoc, bytes, 'remote')
    })

    socket.on('room-state', ({ language: serverLang, users: serverUsers }) => {
      if (serverLang) setLanguage(serverLang)
      setUsers(serverUsers || [])
    })

    socket.on('language-update', ({ language: newLang }) => setLanguage(newLang))
    socket.on('users-update', (updatedUsers) => setUsers(updatedUsers))

    socket.on('user-joined', ({ username: joinedName }) => {
      setMessages(prev => [...prev, { type: 'system', text: `${joinedName} joined`, id: Date.now() }])
    })

    socket.on('user-left', ({ username: leftName, socketId: leftId }) => {
      setMessages(prev => [...prev, { type: 'system', text: `${leftName} left`, id: Date.now() }])
      setTypingUsers(prev => prev.filter(u => u !== leftName))
      if (leftId) removeCursor(leftId)
    })

    socket.on('cursor-remove', ({ socketId: leftId }) => removeCursor(leftId))

    socket.on('chat-message', ({ username: sender, message, timestamp, socketId }) => {
      setMessages(prev => [...prev, {
        type: 'chat', username: sender, message, timestamp,
        id: Date.now() + Math.random(),
        isMe: socketId === socket.id,
      }])
    })

    socket.on('typing-update', ({ username: typingName, isTyping, socketId }) => {
      if (socketId === socket.id) return
      setTypingUsers(prev =>
        isTyping ? [...new Set([...prev, typingName])] : prev.filter(u => u !== typingName)
      )
    })

    socket.on('execution-result', (result) => {
      setOutput(result)
      setRunning(false)
    })

    socket.on('cursor-update', ({ socketId, username: cursorUser, position, selection }) => {
      if (socketId === socket.id) return
      updateCursor(socketId, cursorUser, position, selection)
    })

    return () => {
      yjsBindingRef.current?.destroy()
      yjsBindingRef.current = null
      ydoc.destroy()
      ydocRef.current = null
      socket.disconnect()
      injectedStyles.clear()
    }
  }, [roomId, user, updateCursor, removeCursor]) // eslint-disable-line

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Editor mount — bind Yjs ───────────────────────────────────────────────
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    const ydoc = ydocRef.current
    if (ydoc) {
      const ytext = ydoc.getText('monaco')
      yjsBindingRef.current?.destroy()
      yjsBindingRef.current = new MonacoBinding(ytext, editor.getModel(), new Set([editor]))
    }

    editor.onDidChangeCursorSelection((e) => {
      const pos = editor.getPosition()
      const sel = e.selection
      socketRef.current?.emit('cursor-move', {
        roomId,
        // username omitted — server reads from verified socket
        position: { lineNumber: pos.lineNumber, column: pos.column },
        selection: {
          startLineNumber: sel.startLineNumber, startColumn: sel.startColumn,
          endLineNumber: sel.endLineNumber, endColumn: sel.endColumn,
        },
      })
    })
  }, [roomId])

  // ── Language change ───────────────────────────────────────────────────────
  const handleLanguageChange = (newLang) => {
    if (!isEditor) return
    setLanguage(newLang)
    setYjsCode(DEFAULT_CODE[newLang] || '')
    socketRef.current?.emit('language-change', { roomId, language: newLang })
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    socketRef.current?.emit('chat-message', { roomId, message: chatInput.trim() })
    setChatInput('')
    socketRef.current?.emit('typing', { roomId, isTyping: false })
  }

  const handleChatTyping = (e) => {
    setChatInput(e.target.value)
    socketRef.current?.emit('typing', { roomId, isTyping: true })
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('typing', { roomId, isTyping: false })
    }, 2000)
  }

  // ── Run code ──────────────────────────────────────────────────────────────
  const runCode = async () => {
    if (!isEditor || running) return
    const code = getCode()
    setRunning(true)
    setOutput(null)
    try {
      const res = await axios.post(`${API}/execute/run`, { code, language }, { headers: authHeader() })
      const result = res.data
      setOutput(result)
      socketRef.current?.emit('execution-result', { roomId, result })
    } catch (err) {
      const result = { output: '', error: err.response?.data?.error || 'Execution failed', exitCode: 1 }
      setOutput(result)
      socketRef.current?.emit('execution-result', { roomId, result })
    } finally {
      setRunning(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (socketError) {
    return (
      <div className="h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{socketError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-900 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 glass-nav flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-slate-200 text-sm transition-colors"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-dark-600" />
          <div>
            <h1 className="font-semibold text-slate-100 text-sm">{room.name}</h1>
            <span className={`text-xs ${isEditor ? 'text-accent-green' : 'text-accent-yellow'}`}>
              {isEditor ? '✏️ Editor' : '👁 Viewer'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Avatar row */}
          <div className="flex -space-x-2 mr-1">
            {users.slice(0, 6).map((u, i) => {
              const color = getColorForSocket(u.socketId || `idx-${i}`)
              return (
                <div
                  key={u.socketId || i}
                  className="w-7 h-7 rounded-full border-2 border-dark-800 flex items-center justify-center text-xs font-bold text-white cursor-default select-none"
                  style={{ backgroundColor: color }}
                  title={`${u.username} (${u.role})`}
                >
                  {u.role === 'viewer' ? '👁' : u.username?.[0]?.toUpperCase()}
                </div>
              )
            })}
            {users.length > 6 && (
              <div className="w-7 h-7 rounded-full border-2 border-dark-800 bg-dark-600 flex items-center justify-center text-xs text-slate-400">
                +{users.length - 6}
              </div>
            )}
          </div>

          {/* Language selector */}
          <select
            className="bg-white/[0.04] border border-white/10 text-slate-100 text-xs px-2 py-1.5 rounded-md font-mono backdrop-blur-md focus:outline-none focus:border-yellow-400/70 focus:ring-2 focus:ring-yellow-400/20 disabled:opacity-50 transition-all"
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            disabled={!isEditor}
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* CPP Snippet dropdown — visible only when cpp selected */}
          {language === 'cpp' && isEditor && (
            <select
              className="bg-white/[0.04] border border-white/10 text-slate-100 text-xs px-1 py-1.5 rounded-md backdrop-blur-md focus:outline-none focus:border-yellow-400/70 focus:ring-2 focus:ring-yellow-400/20 transition-all w-7 cursor-pointer"
              defaultValue=""
              onChange={e => {
                if (!e.target.value) return
                const snippet = CPP_SNIPPETS.find(s => s.title === e.target.value)
                if (snippet) setYjsCode(snippet.code)
                e.target.value = ''
              }}
            >
              <option value="" disabled>📋</option>
              {CPP_SNIPPETS.map(s => (
                <option key={s.title} value={s.title}>{s.title}</option>
              ))}
            </select>
          )}

          {/* Run button */}
          {isEditor && (
            <button
              onClick={runCode}
              disabled={running}
              className="flex items-center gap-1.5 bg-accent-green hover:bg-emerald-300 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-all"
            >
              {running
                ? <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Running…</>
                : <>▶ Run</>}
            </button>
          )}

          {/* Copy */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(getCode())
              setCopied('y')
              setTimeout(() => setCopied(''), 1500)
            }}
            className="text-slate-500 hover:text-slate-200 text-xs transition-colors px-2 py-1.5"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>

          {/* Version History toggle */}
          <button
            onClick={() => setShowHistory(h => !h)}
            className={`text-xs px-2 py-1.5 rounded-md transition-all
                        ${showHistory ? 'bg-yellow-400 text-black' : 'bg-dark-700 text-slate-400 hover:text-slate-200'}`}
          >
            🕐 History
          </button>

          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen(c => !c)}
            className={`text-xs px-2 py-1.5 rounded-md transition-all
                        ${chatOpen ? 'bg-yellow-400 text-black' : 'bg-dark-700 text-slate-400 hover:text-slate-200'}`}
          >
            💬 Chat
          </button>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Editor + output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={MONACO_LANG[language] || 'javascript'}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontLigatures: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                readOnly: !isEditor,
                automaticLayout: true,
                padding: { top: 16 },
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                wordWrap: 'on',
              }}
            />
          </div>

          {/* Output panel */}
          {output && (
            <div className="border-t border-dark-600 bg-dark-800 flex-shrink-0" style={{ maxHeight: '200px', overflow: 'auto' }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Output</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${output.exitCode === 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    Exit: {output.exitCode}
                  </span>
                  <button onClick={() => setOutput(null)} className="text-slate-500 hover:text-slate-200 text-sm">×</button>
                </div>
              </div>
              <pre className="px-4 py-3 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                {output.compilerMessage && <span className="text-yellow-400">{output.compilerMessage}{'\n'}</span>}
                {output.output && <span>{output.output}</span>}
                {output.error && <span className="text-red-400">{output.error}</span>}
                {!output.compilerMessage && !output.output && !output.error && <span className="text-slate-500">(no output)</span>}
              </pre>
            </div>
          )}
        </div>

        {/* ── Version History panel ────────────────────────────────────── */}
        {showHistory && (
          <VersionHistory
            roomId={room.id}
            isEditor={isEditor}
            getCode={getCode}           /* prop instead of window global */
            onRestore={(code) => {
              setYjsCode(code)
              setShowHistory(false)
            }}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* ── Chat panel ───────────────────────────────────────────────── */}
        {chatOpen && (
          <div className="w-72 flex flex-col border-l border-dark-600 bg-dark-800 flex-shrink-0">
            <div className="px-4 py-3 border-b border-dark-700 flex-shrink-0">
              <h3 className="font-medium text-sm text-slate-200">Chat</h3>
              <p className="text-xs text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} in room</p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.type === 'system'
                    ? <div className="text-center text-xs text-slate-600 py-1">{msg.text}</div>
                    : (
                      <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                        {!msg.isMe && <span className="text-xs text-slate-500 mb-0.5 px-1">{msg.username}</span>}
                        <div className={`max-w-full rounded-lg px-3 py-2 text-xs break-words ${msg.isMe ? 'bg-yellow-400 text-black' : 'bg-dark-700 text-slate-200'}`}>
                          {msg.message}
                        </div>
                      </div>
                    )
                  }
                </div>
              ))}
              {typingUsers.length > 0 && (
                <div className="text-xs text-slate-500 italic">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t border-dark-700 flex-shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={handleChatTyping}
                placeholder="Type a message…"
                className="flex-1 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-primary"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-accent-primary hover:bg-yellow-300 disabled:opacity-40 text-white px-3 py-2 rounded-lg transition-all text-xs"
              >
                →
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}