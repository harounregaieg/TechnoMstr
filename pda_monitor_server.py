import socket
import json
from datetime import datetime
import tkinter as tk
from tkinter import ttk
import threading
import time
import nmap
import requests
from zeroconf import ServiceBrowser, Zeroconf
import netifaces

class PDAMonitorServer:
    def __init__(self):
        self.devices = {}  # Store device information
        self.zeroconf = Zeroconf()
        
        # Create GUI
        self.root = tk.Tk()
        self.root.title("Zebra PDA Monitor")
        self.root.geometry("800x600")
        
        # Create main frame
        self.main_frame = ttk.Frame(self.root, padding="10")
        self.main_frame.pack(fill="both", expand=True)
        
        # Create device list
        self.device_list = ttk.Treeview(self.main_frame, columns=("IP", "Battery", "Storage", "Last Update"))
        self.device_list.heading("#0", text="Device ID")
        self.device_list.heading("IP", text="IP Address")
        self.device_list.heading("Battery", text="Battery")
        self.device_list.heading("Storage", text="Storage")
        self.device_list.heading("Last Update", text="Last Update")
        self.device_list.pack(fill="both", expand=True, pady=10)
        
        # Create scan button
        self.scan_button = ttk.Button(self.main_frame, text="Scan Network", command=self.start_scan)
        self.scan_button.pack(pady=10)
        
        # Start background scanning
        self.scan_thread = threading.Thread(target=self.continuous_scan)
        self.scan_thread.daemon = True
        self.scan_thread.start()
    
    def update_device_list(self):
        """Update the device list in the GUI"""
        # Clear existing items
        for item in self.device_list.get_children():
            self.device_list.delete(item)
        
        # Add current devices
        for device_id, device_info in self.devices.items():
            self.device_list.insert("", "end", text=device_id,
                                  values=(device_info.get('ip', '--'),
                                         f"{device_info.get('battery_percent', '--')}%",
                                         device_info.get('storage_info', '--'),
                                         device_info.get('last_update', 'Never')))
    
    def get_local_network(self):
        """Get the local network address"""
        interfaces = netifaces.interfaces()
        for interface in interfaces:
            addrs = netifaces.ifaddresses(interface)
            if netifaces.AF_INET in addrs:
                for addr in addrs[netifaces.AF_INET]:
                    if 'addr' in addr and not addr['addr'].startswith('127.'):
                        ip = addr['addr']
                        netmask = addr['netmask']
                        # Convert to network address
                        network = '.'.join([str(int(ip.split('.')[i]) & int(netmask.split('.')[i])) 
                                          for i in range(4)])
                        return f"{network}/24"
        return None
    
    def scan_network(self):
        """Scan the network for Zebra PDAs"""
        network = self.get_local_network()
        if not network:
            print("Could not determine local network")
            return
        
        nm = nmap.PortScanner()
        nm.scan(hosts=network, arguments='-sn')
        
        for host in nm.all_hosts():
            try:
                # Try to identify Zebra devices
                if self.is_zebra_device(host):
                    device_id = f"Zebra-{host.replace('.', '-')}"
                    if device_id not in self.devices:
                        self.devices[device_id] = {
                            'ip': host,
                            'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        }
                        self.root.after(0, self.update_device_list)
                    
                    # Try to get device status
                    self.update_device_status(device_id, host)
            except Exception as e:
                print(f"Error scanning host {host}: {e}")
    
    def is_zebra_device(self, ip):
        """Check if the device is a Zebra PDA"""
        try:
            # Try common Zebra ports
            ports = [80, 443, 8080, 8443]  # Common web interface ports
            for port in ports:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex((ip, port))
                sock.close()
                if result == 0:
                    return True
        except:
            pass
        return False
    
    def update_device_status(self, device_id, ip):
        """Try to get device status through various methods"""
        try:
            # Method 1: Try HTTP requests
            try:
                response = requests.get(f"http://{ip}/status", timeout=1)
                if response.status_code == 200:
                    status = response.json()
                    self.devices[device_id].update({
                        'battery_percent': status.get('battery', '--'),
                        'storage_info': status.get('storage', '--'),
                        'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    })
                    self.root.after(0, self.update_device_list)
                    return
            except:
                pass
            
            # Method 2: Try SNMP (if enabled)
            # Add SNMP polling code here
            
            # Method 3: Try Zebra specific protocols
            # Add Zebra specific protocol code here
            
        except Exception as e:
            print(f"Error updating status for {device_id}: {e}")
    
    def start_scan(self):
        """Start a network scan"""
        threading.Thread(target=self.scan_network).start()
    
    def continuous_scan(self):
        """Continuously scan the network"""
        while True:
            self.scan_network()
            time.sleep(300)  # Scan every 5 minutes
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    server = PDAMonitorServer()
    server.run() 