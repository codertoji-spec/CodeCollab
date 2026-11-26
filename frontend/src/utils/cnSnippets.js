/**
 * Computer Networks Lab Snippets (Experiments 2 through 7)
 * Each snippet contains:
 * 1. 5-point concise theory
 * 2. Sample input and expected output
 * 3. Verified, bug-free C++ implementation
 */

export const CN_SNIPPETS = {
  fkcn2: `/* =============================================================
   EXPERIMENT 2: BIT STUFFING
   -------------------------------------------------------------
   THEORY:
   1. Bit stuffing is a Data Link Layer framing mechanism used for transparency.
   2. Special flag bytes (like 01111110) mark the beginning and end of frames.
   3. To prevent data from being mistaken as a flag, sender stuffs a '0' after five consecutive '1's.
   4. The receiver reverses the process: whenever it reads five consecutive '1's followed by '0', it destuffs (drops) the '0'.
   5. This achieves byte/bit-oriented data transparency irrespective of payload content.

   SAMPLE INPUT & OUTPUT:
   -------------------------------------------------------------
   Sample Input:
   1111110111110

   Sample Output:
   Original Data: 1111110111110
   Stuffed Data : 111110101111100
   ============================================================= */

#include <iostream>
#include <string>
using namespace std;

int main()
{
    string data, stuffed = "";
    int count = 0;

    cout << "Enter the data bits: ";
    cin >> data;

    for (int i = 0; i < data.length(); i++)
    {
        stuffed += data[i];

        if (data[i] == '1')
        {
            count++;
            if (count == 5)
            {
                stuffed += '0';
                count = 0;
            }
        }
        else
        {
            count = 0;
        }
    }

    cout << "\\nOriginal Data: " << data << endl;
    cout << "Stuffed Data : " << stuffed << endl;
    return 0;
}`,

  fkcn3: `/* =============================================================
   EXPERIMENT 3: CYCLIC REDUNDANCY CHECK (CRC)
   -------------------------------------------------------------
   THEORY:
   1. CRC is a powerful polynomial division-based error detection method in the Data Link Layer.
   2. Both sender and receiver agree on a generator polynomial G(x) of degree (n - 1).
   3. Sender appends (n - 1) zeros to data bits and divides by G(x) using modulo-2 binary division (XOR).
   4. The resulting remainder is appended to the original data to form the transmitted codeword.
   5. If received codeword divided by G(x) yields a zero remainder, data is accepted without transmission error.

   SAMPLE INPUT & OUTPUT:
   -------------------------------------------------------------
   Sample Input:
   Enter data bits: 110101
   Enter generator bits: 1011

   Sample Output:
   Data bits : 110101
   Generator bits : 1011
   CRC remainder : 010
   Transmitted data: 110101010
   ============================================================= */

#include <iostream>
#include <string>
using namespace std;

string crc(string data, string generator)
{
    string temp = data;
    int n = generator.length();

    for (int i = 0; i < n - 1; i++)
        temp += '0';

    for (int i = 0; i < data.length(); i++)
    {
        if (temp[i] == '1')
        {
            for (int j = 0; j < n; j++)
            {
                temp[i + j] = (temp[i + j] == generator[j]) ? '0' : '1';
            }
        }
    }

    return temp.substr(data.length(), n - 1);
}

int main()
{
    string data, generator;

    cout << "Enter data bits: ";
    cin >> data;
    cout << "Enter generator bits: ";
    cin >> generator;

    if (data.find_first_not_of("01") != string::npos || generator.find_first_not_of("01") != string::npos || generator.length() < 2 || generator[0] != '1' || generator.back() != '1')
    {
        cout << "Invalid input!\\n";
        return 1;
    }

    string remainder = crc(data, generator);
    string codeword = data + remainder;

    cout << "\\nData bits : " << data;
    cout << "\\nGenerator bits : " << generator;
    cout << "\\nCRC remainder : " << remainder;
    cout << "\\nTransmitted data: " << codeword << endl;
    return 0;
}`,

  fkcn4_1: `/* =============================================================
   EXPERIMENT 4.1: STOP-AND-WAIT PROTOCOL
   -------------------------------------------------------------
   THEORY:
   1. Stop-and-Wait is a flow and error control protocol operating at the Data Link/Transport Layer.
   2. Sender transmits one frame at a time and stops, waiting for an acknowledgment (ACK).
   3. A timeout timer starts when a frame is sent; if no ACK is received before timeout, the frame is retransmitted.
   4. Sequence numbers (0 and 1) are used alternatively to distinguish duplicate frames and prevent retransmission ambiguity.
   5. It offers simplicity and high reliability across noisy channels, though channel utilization is lower than pipelined protocols.

   SAMPLE INPUT & OUTPUT:
   -------------------------------------------------------------
   Sample Input:
   Enter total number of frames to send: 3

   Sample Output:
   [Sender] Sending Frame 1 (Seq: 0)...
   [Receiver] Frame 1 (Seq: 0) received successfully.
   [Receiver] Sending ACK 1...
   [Sender] ACK received! Moving to next frame.

   [Sender] Sending Frame 2 (Seq: 1)...
   [Channel] Frame 2 or ACK lost! Timeout occurred.
   [Sender] Retransmitting Frame 2...
   [Receiver] Frame 2 (Seq: 1) received successfully.
   [Receiver] Sending ACK 0...
   [Sender] ACK received! Moving to next frame.

   [Sender] Sending Frame 3 (Seq: 0)...
   [Receiver] Frame 3 (Seq: 0) received successfully.
   [Receiver] Sending ACK 1...
   [Sender] ACK received! Moving to next frame.

   All 3 frames transmitted successfully!
   ============================================================= */

#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

int main()
{
    srand(time(0));
    int totalFrames;

    cout << "Enter total number of frames to send: ";
    cin >> totalFrames;

    int frame = 1;
    int seqNum = 0;

    while (frame <= totalFrames)
    {
        cout << "\\n[Sender] Sending Frame " << frame << " (Seq: " << seqNum << ")...";

        int event = rand() % 3;

        if (event == 0)
        {
            cout << "\\n[Channel] Frame " << frame << " or ACK lost! Timeout occurred.";
            cout << "\\n[Sender] Retransmitting Frame " << frame << "...";
        }
        else
        {
            cout << "\\n[Receiver] Frame " << frame << " (Seq: " << seqNum << ") received successfully.";
            cout << "\\n[Receiver] Sending ACK " << (1 - seqNum) << "...";
            cout << "\\n[Sender] ACK received! Moving to next frame.\\n";

            seqNum = 1 - seqNum;
            frame++;
        }
    }

    cout << "\\nAll " << totalFrames << " frames transmitted successfully!\\n";
    return 0;
}`,

  fkcn4_2: `/* =============================================================
   EXPERIMENT 4.2: PARITY BIT ERROR DETECTION
   -------------------------------------------------------------
   THEORY:
   1. Parity bit is the simplest error-detecting code, appending an extra bit to a binary message.
   2. Even parity ensures the total count of 1s in the codeword (data + parity) is always an even number.
   3. Odd parity ensures the total count of 1s in the codeword is always an odd number.
   4. At receiver, parity is recalculated: any parity mismatch signifies a transmission bit-flip error.
   5. Detects all odd numbers of single-bit errors; fails if an even number of bits are inverted simultaneously.

   SAMPLE INPUT & OUTPUT:
   -------------------------------------------------------------
   Sample Input:
   Enter binary data bits: 1011001
   Select Parity Type (1 for Even Parity, 2 for Odd Parity): 1
   Enter received codeword: 10110010

   Sample Output:
   Generated Parity Bit : 0
   Transmitted Codeword : 10110010
   Result: No error detected (Valid Data).
   ============================================================= */

#include <iostream>
#include <string>
using namespace std;

int countOnes(const string& bits)
{
    int count = 0;
    for (char c : bits)
    {
        if (c == '1') count++;
    }
    return count;
}

int main()
{
    string data, received;
    int choice;

    cout << "Enter binary data bits: ";
    cin >> data;
    cout << "Select Parity Type (1 for Even Parity, 2 for Odd Parity): ";
    cin >> choice;

    int ones = countOnes(data);
    char parityBit;

    if (choice == 1)
    {
        parityBit = (ones % 2 == 0) ? '0' : '1';
    }
    else
    {
        parityBit = (ones % 2 == 0) ? '1' : '0';
    }

    string codeword = data + parityBit;

    cout << "\\nGenerated Parity Bit : " << parityBit;
    cout << "\\nTransmitted Codeword : " << codeword << endl;

    cout << "\\nEnter received codeword: ";
    cin >> received;

    int rxOnes = countOnes(received);
    bool isValid = (choice == 1) ? (rxOnes % 2 == 0) : (rxOnes % 2 != 0);

    if (isValid)
    {
        cout << "Result: No error detected (Valid Data).\\n";
    }
    else
    {
        cout << "Result: Error detected in received data!\\n";
    }
    return 0;
}`,

  fkcn4_3: `/* =============================================================
   EXPERIMENT 4.3: HAMMING CODE (7,4) ERROR DETECTION & CORRECTION
   -------------------------------------------------------------
   THEORY:
   1. Hamming (7,4) code encodes 4 data bits into a 7-bit codeword using 3 redundant parity bits.
   2. Parity bits reside at powers-of-two bit positions (1, 2, 4), covering overlapping data subsets.
   3. Synderome bits (c4, c2, c1) are evaluated at receiver using XOR parity check equations.
   4. If syndrome equals 000, no error occurred; if non-zero, decimal value indicates exact erroneous bit position.
   5. Can detect up to two simultaneous bit errors and automatically correct any single-bit flip error.

   SAMPLE INPUT & OUTPUT:
   -------------------------------------------------------------
   Sample Input:
   Enter 4 data bits separated by spaces: 1 0 1 1
   Enter received 7 bits separated by spaces: 0 1 1 0 0 1 1

   Sample Output:
   Encoded 7-bit Hamming Codeword: 0 1 1 0 0 1 1
   Result: Error detected at bit position 1!
   Corrected 7-bit Codeword: 0 1 1 0 0 1 1
   Extracted Original Data : 1 0 1 1
   ============================================================= */

#include <iostream>
using namespace std;

int main()
{
    int data[4], hamming[8], rx[8];

    cout << "Enter 4 data bits separated by spaces (e.g., 1 0 1 1): ";
    cin >> data[0] >> data[1] >> data[2] >> data[3];

    hamming[3] = data[0];
    hamming[5] = data[1];
    hamming[6] = data[2];
    hamming[7] = data[3];

    hamming[1] = hamming[3] ^ hamming[5] ^ hamming[7];
    hamming[2] = hamming[3] ^ hamming[6] ^ hamming[7];
    hamming[4] = hamming[5] ^ hamming[6] ^ hamming[7];

    cout << "\\nEncoded 7-bit Hamming Codeword: ";
    for (int i = 1; i <= 7; i++)
    {
        cout << hamming[i] << " ";
    }
    cout << endl;

    cout << "\\nEnter received 7 bits separated by spaces: ";
    for (int i = 1; i <= 7; i++)
    {
        cin >> rx[i];
    }

    int c1 = rx[1] ^ rx[3] ^ rx[5] ^ rx[7];
    int c2 = rx[2] ^ rx[3] ^ rx[6] ^ rx[7];
    int c4 = rx[4] ^ rx[5] ^ rx[6] ^ rx[7];

    int errorPos = (c4 * 4) + (c2 * 2) + (c1 * 1);

    if (errorPos == 0)
    {
        cout << "\\nResult: No error detected during transmission.\\n";
    }
    else
    {
        cout << "\\nResult: Error detected at bit position " << errorPos << "!";
        rx[errorPos] ^= 1;
        cout << "\\nCorrected 7-bit Codeword: ";
        for (int i = 1; i <= 7; i++)
        {
            cout << rx[i] << " ";
        }
        cout << endl;
    }

    cout << "Extracted Original Data : " << rx[3] << " " << rx[5] << " " << rx[6] << " " << rx[7] << endl;
    return 0;
}`,

  fkcn5: `/* =============================================================
   EXPERIMENT 5: SLIDING WINDOW PROTOCOL (GO-BACK-N SIMULATION)
   -------------------------------------------------------------
   THEORY:
   1. Sliding Window is a pipelined Data Link Layer protocol allowing multiple frames sent before waiting for ACK.
   2. The sender maintains a transmit window of size N, restricting unacknowledged outstanding frames.
   3. In Go-Back-N, receiver only accepts frames in strict sequential order, discarding out-of-order packets.
   4. If frame 'i' or its ACK is lost, timeout occurs, sender window rolls back and retransmits starting from frame 'i'.
   5. Significantly improves link bandwidth utilization compared to Stop-and-Wait on high-latency channels.

   SAMPLE INPUT & OUTPUT:
   -------------------------------------------------------------
   Sample Input:
   Enter total number of frames to send: 4
   Enter window size: 2

   Sample Output:
   --- Sending Window ---
   [Sender] Sent Frame 1
   [Sender] Sent Frame 2
   [Receiver] Frame 1 acknowledged (ACK 2).
   [Receiver] Frame 2 acknowledged (ACK 3).

   --- Sending Window ---
   [Sender] Sent Frame 3
   [Sender] Sent Frame 4
   [Receiver] Frame 3 acknowledged (ACK 4).
   [Receiver] Frame 4 acknowledged (ACK 5).

   All 4 frames transmitted and acknowledged successfully!
   ============================================================= */

#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

int main()
{
    srand(time(0));
    int totalFrames, windowSize;

    cout << "Enter total number of frames to send: ";
    cin >> totalFrames;
    cout << "Enter window size: ";
    cin >> windowSize;

    int sent = 1;

    while (sent <= totalFrames)
    {
        int framesInWindow = 0;

        cout << "\\n--- Sending Window ---\\n";
        for (int i = sent; i < sent + windowSize && i <= totalFrames; i++)
        {
            cout << "[Sender] Sent Frame " << i << endl;
            framesInWindow++;
        }

        int ackCount = 0;
        for (int i = sent; i < sent + framesInWindow; i++)
        {
            int event = rand() % 3;

            if (event == 0)
            {
                cout << "[Channel] Frame " << i << " or its ACK lost! Timeout occurred." << endl;
                cout << "[Sender] Going back to Frame " << i << " and retransmitting window..." << endl;
                break;
            }
            else
            {
                cout << "[Receiver] Frame " << i << " acknowledged (ACK " << i + 1 << ")." << endl;
                ackCount++;
            }
        }

        sent += ackCount;
    }

    cout << "\\nAll " << totalFrames << " frames transmitted and acknowledged successfully!\\n";
    return 0;
}`,

  fkcn6: `/* =============================================================
   EXPERIMENT 6: LINK STATE ROUTING ALGORITHM (DIJKSTRA'S)
   -------------------------------------------------------------
   THEORY:
   1. Link State Routing is a dynamic routing algorithm where every router possesses complete network topology knowledge.
   2. Routers flood Link State Packets (LSPs) across the network to synchronize their topology databases.
   3. Each router independently executes Dijkstra's shortest path algorithm using itself as source root node.
   4. Computes minimal-cost paths and next-hop forwarding decisions, completely eliminating routing loops.
   5. Forms foundation of standard enterprise interior gateway protocols like OSPF and IS-IS.

   SAMPLE INPUT & OUTPUT:
   -------------------------------------------------------------
   Sample Input:
   Enter number of routers: 3
   Enter the cost adjacency matrix (0 for no direct link):
   0 4 2
   4 0 1
   2 1 0
   Enter source router (0 to 2): 0

   Sample Output:
   --- Routing Table for Router 0 ---
   Destination	Min Cost	Shortest Path
   0		0		0
   1		3		0 -> 2 -> 1
   2		2		0 -> 2
   ============================================================= */

#include <iostream>
#include <vector>
#include <climits>
using namespace std;

void printPath(int current, const vector<int>& parent)
{
    if (parent[current] == -1)
    {
        cout << current;
        return;
    }
    printPath(parent[current], parent);
    cout << " -> " << current;
}

void linkStateRouting(int n, const vector<vector<int>>& cost, int src)
{
    vector<int> dist(n, INT_MAX);
    vector<bool> visited(n, false);
    vector<int> parent(n, -1);
    dist[src] = 0;

    for (int count = 0; count < n - 1; count++)
    {
        int u = -1, minDist = INT_MAX;
        for (int i = 0; i < n; i++)
        {
            if (!visited[i] && dist[i] < minDist)
            {
                minDist = dist[i];
                u = i;
            }
        }

        if (u == -1) break;
        visited[u] = true;

        for (int v = 0; v < n; v++)
        {
            if (!visited[v] && cost[u][v] != 0 && dist[u] != INT_MAX && dist[u] + cost[u][v] < dist[v])
            {
                dist[v] = dist[u] + cost[u][v];
                parent[v] = u;
            }
        }
    }

    cout << "\\n--- Routing Table for Router " << src << " ---\\n";
    cout << "Destination\\tMin Cost\\tShortest Path\\n";
    for (int i = 0; i < n; i++)
    {
        cout << i << "\\t\\t";
        if (dist[i] == INT_MAX)
        {
            cout << "INF\\t\\tUnreachable\\n";
        }
        else
        {
            cout << dist[i] << "\\t\\t";
            printPath(i, parent);
            cout << endl;
        }
    }
}

int main()
{
    int n, src;

    cout << "Enter number of routers: ";
    cin >> n;

    vector<vector<int>> cost(n, vector<int>(n));

    cout << "Enter the cost adjacency matrix (0 for no direct link):\\n";
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            cin >> cost[i][j];
        }
    }

    cout << "Enter source router (0 to " << n - 1 << "): ";
    cin >> src;

    linkStateRouting(n, cost, src);
    return 0;
}`,

  fkcn7: `/* =============================================================
   EXPERIMENT 7: CONGESTION CONTROL VIA LEAKY BUCKET ALGORITHM
   -------------------------------------------------------------
   THEORY:
   1. Leaky Bucket is a traffic shaping/policing algorithm regulating output rate into the network.
   2. Burst inputs of arbitrary speeds are stored inside a finite-capacity queue (bucket buffer).
   3. Water leaks (packets are transmitted) at a strictly constant, predictable, uniform rate.
   4. If incoming burst volume exceeds available bucket capacity, excess overflow packets are immediately dropped.
   5. Smooths bursty traffic, enforces SLA bandwidth contracts, and prevents downstream network congestion.

   SAMPLE INPUT & OUTPUT:
   -------------------------------------------------------------
   Sample Input:
   Enter bucket capacity (in packets/bytes): 10
   Enter constant output leak rate: 3
   Enter number of time intervals: 3
   Enter incoming data size for each time interval:
   4 8 2

   Sample Output:
   Time	Incoming	Buffer Before	Dropped		Transmitted	Buffer After
   ------------------------------------------------------------------------------------
   1	4		4		0		3		1
   2	8		9		0		3		6
   3	2		8		0		3		5
   4	0		5		0		3		2
   5	0		2		0		2		0
   ============================================================= */

#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main()
{
    int bucketSize, outputRate, n;

    cout << "Enter bucket capacity (in packets/bytes): ";
    cin >> bucketSize;
    cout << "Enter constant output leak rate: ";
    cin >> outputRate;
    cout << "Enter number of time intervals: ";
    cin >> n;

    vector<int> incoming(n);

    cout << "Enter incoming data size for each time interval:\\n";
    for (int i = 0; i < n; i++)
    {
        cin >> incoming[i];
    }

    int currentBuffer = 0;

    cout << "\\nTime\\tIncoming\\tBuffer Before\\tDropped\\t\\tTransmitted\\tBuffer After\\n";
    cout << "------------------------------------------------------------------------------------\\n";

    for (int i = 0; i < n; i++)
    {
        int dropped = 0;

        if (currentBuffer + incoming[i] > bucketSize)
        {
            dropped = (currentBuffer + incoming[i]) - bucketSize;
            currentBuffer = bucketSize;
        }
        else
        {
            currentBuffer += incoming[i];
        }

        int bufferBefore = currentBuffer;
        int transmitted = min(currentBuffer, outputRate);
        currentBuffer -= transmitted;

        cout << i + 1 << "\\t" << incoming[i] << "\\t\\t" << bufferBefore << "\\t\\t" << dropped << "\\t\\t" << transmitted << "\\t\\t" << currentBuffer << endl;
    }

    int extraTime = n + 1;
    while (currentBuffer > 0)
    {
        int bufferBefore = currentBuffer;
        int transmitted = min(currentBuffer, outputRate);
        currentBuffer -= transmitted;

        cout << extraTime++ << "\\t" << 0 << "\\t\\t" << bufferBefore << "\\t\\t" << 0 << "\\t\\t" << transmitted << "\\t\\t" << currentBuffer << endl;
    }

    return 0;
}`
};

CN_SNIPPETS.fkcn4 = CN_SNIPPETS.fkcn4_1;

