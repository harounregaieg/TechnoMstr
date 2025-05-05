import socket
import json
import time
import uuid
import os
import platform
import psutil

def get_device_id():
    """Generate a unique device ID"""
    try:
        # Try to get MAC address
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff)
                       for elements in range(0, 2 * 6, 2)][::-1])
        return f"Zebra-{mac}"
    except:
        # Fallback to random UUID if MAC address can't be obtained
        return f"Zebra-{str(uuid.uuid4())[:8]}"

def get_battery_info():
    """Get battery information"""
    try:
        # This is a placeholder - you'll need to implement the actual battery reading
        # for your specific Zebra device model
        return {
            'battery_percent': 100,  # Replace with actual battery reading
            'is_charging': False,    # Replace with actual charging status
            'battery_health': 'good' # Replace with actual health status
        }
    except Exception as e:
        print(f"Error getting battery info: {e}")
        return {'battery_percent': 0, 'is_charging': False, 'battery_health': 'error'}

def get_storage_info():
    """Get storage information"""
    try:
        # This is a placeholder - you'll need to implement the actual storage reading
        # for your specific Zebra device model
        return {
            'total_space': 32000000000,  # 32GB in bytes
            'free_space': 16000000000,   # 16GB in bytes
            'used_space': 16000000000    # 16GB in bytes
        }
    except Exception as e:
        print(f"Error getting storage info: {e}")
        return {'total_space': 0, 'free_space': 0, 'used_space': 0}

def format_storage_info(storage_data):
    """Format storage information into human-readable format"""
    total = storage_data['total_space'] / (1024 * 1024 * 1024)  # Convert to GB
    free = storage_data['free_space'] / (1024 * 1024 * 1024)
    used = storage_data['used_space'] / (1024 * 1024 * 1024)
    return f"Total: {total:.1f}GB, Used: {used:.1f}GB, Free: {free:.1f}GB"

def broadcast_presence(broadcast_port=5001):
    """Broadcast device presence on the network"""
    broadcast_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    broadcast_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    
    device_id = get_device_id()
    broadcast_data = json.dumps({
        'device_id': device_id,
        'type': 'zebra_pda',
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    }).encode()
    
    while True:
        try:
            broadcast_socket.sendto(broadcast_data, ('<broadcast>', broadcast_port))
            time.sleep(30)  # Broadcast every 30 seconds
        except Exception as e:
            print(f"Broadcast error: {e}")
            time.sleep(5)

def send_status(server_ip, server_port=5000):
    """Send device status to the server"""
    device_id = get_device_id()
    
    while True:
        try:
            # Create socket
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.connect((server_ip, server_port))
            
            # Get device information
            battery_info = get_battery_info()
            storage_info = get_storage_info()
            
            # Prepare status data
            status_data = {
                'device_id': device_id,
                'battery_percent': battery_info['battery_percent'],
                'is_charging': battery_info['is_charging'],
                'battery_health': battery_info['battery_health'],
                'storage_info': format_storage_info(storage_info),
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Send data
            client_socket.send(json.dumps(status_data).encode())
            client_socket.close()
            
            # Wait before next update
            time.sleep(60)  # Update every minute
            
        except Exception as e:
            print(f"Error sending status: {e}")
            time.sleep(5)  # Wait 5 seconds before retrying

if __name__ == "__main__":
    import threading
    
    # Start broadcast thread
    broadcast_thread = threading.Thread(target=broadcast_presence)
    broadcast_thread.daemon = True
    broadcast_thread.start()
    
    # Start status update thread
    # Note: In a real deployment, you would need to discover the server IP
    # For testing, you can hardcode it
    SERVER_IP = "10.0.0.100"  # Change this to your server's IP address
    status_thread = threading.Thread(target=send_status, args=(SERVER_IP,))
    status_thread.daemon = True
    status_thread.start()
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...") 