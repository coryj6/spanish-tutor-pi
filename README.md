# 🇪🇸 Spanish Tutor AI: Distributed Edge System

A hybrid AI application that transforms a Raspberry Pi into an interactive Spanish language tutor. To overcome the hardware constraints of edge computing, this system utilizes a distributed architecture, offloading heavy LLM inference to a networked workstation while maintaining a lightweight interface on the Pi.

## 🏗 System Architecture

The project employs a **Client-Server model** connected via local networking:

* **The Interface (Client):** A Raspberry Pi running a Python-based application that manages user input and conversational logic.
* **The Brain (Inference Server):** A Windows-based workstation running **Ollama** with the `Llama 3.2 3B` model.
* **The Bridge:** Communication is handled via REST API calls over **mDNS**, allowing the Pi to find the server at `DESKTOP-73EMHQA.local` regardless of IP changes.



---

## 🛠 Tech Stack

* **AI Model:** Llama 3.2 (3B Parameters)
* **Backend:** Ollama
* **Language:** Python 3.x
* **Libraries:** `ollama-python`, `python-dotenv`
* **Networking:** mDNS/Avahi (Discovery), HTTP (Transport)

---

## 🚀 Setup & Installation

### 1. Server Configuration (The Host)
On your Windows/Linux workstation:
1.  **Install Ollama:** Follow instructions at [ollama.com](https://ollama.com).
2.  **Stability Tuning:** If using older NVIDIA hardware (e.g., 940MX), force CPU mode to avoid VRAM allocation errors by setting:
    * `CUDA_VISIBLE_DEVICES = -1`
3.  **Network Configuration:** Set the following Environment Variables to allow the Pi to connect:
    * `OLLAMA_HOST = 0.0.0.0`
    * `OLLAMA_ORIGINS = *`
4.  **Restart Ollama** to apply changes.

### 2. Client Configuration (The Pi)
1.  **Install Networking Tools:**
    ```bash
    sudo apt update && sudo apt install avahi-daemon
    ```
2.  **Install Python Dependencies:**
    ```bash
    pip install ollama python-dotenv
    ```
3.  **Environment Setup:** Create a `.env` file in the root directory:
    ```text
    OLLAMA_HOST=[http://DESKTOP-73EMHQA.local:11434](http://DESKTOP-73EMHQA.local:11434)
    ```

---

## 📂 Project Structure

* `spanish_tutor.py`: The core application logic, including the Tutor persona prompt and conversation loop.
* `requirements.txt`: Python package dependencies.
* `.env.example`: Template for local environment configuration.
* `.gitignore`: Prevents logs and environment secrets from being committed.

---
* **Solution:** Implemented a **CPU-AVX bypass** and migrated to a **distributed inference model**, allowing the Pi to access the laptop's RAM (12GB+) rather than being limited by local hardware or failing GPU drivers.
* **Persistence:** Moved from static IP addressing to **mDNS hostnames**, ensuring the "bridge" between devices survives router reboots.


---

## 📈 Roadmap

- [ ] Add Speech-to-Text (STT) for hands-free practice.
- [ ] Implement a SQLite database to track vocabulary progress.
- [ ] Add a visual dashboard for learning stats.
