package com.tridev.rpgg;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Servidor WebSocket local (LAN) exposto ao JS como plugin `RoomServer`.
 * Contrato espelhado em src/room/nativeRoomServer.ts.
 */
@CapacitorPlugin(name = "RoomServer")
public class RoomServerPlugin extends Plugin {
    private WebSocketServer server;
    private final Map<String, WebSocket> clientsById = new ConcurrentHashMap<>();
    private final Map<WebSocket, String> idsByClient = new ConcurrentHashMap<>();

    @PluginMethod
    public void start(PluginCall call) {
        int port = call.getInt("port", 8765);
        stopServer();
        final AtomicBoolean settled = new AtomicBoolean(false);

        server = new WebSocketServer(new InetSocketAddress(port)) {
            @Override
            public void onStart() {
                setConnectionLostTimeout(20);
                if (settled.compareAndSet(false, true)) {
                    JSObject ret = new JSObject();
                    ret.put("host", lanAddress());
                    ret.put("port", getPort());
                    call.resolve(ret);
                }
            }

            @Override
            public void onOpen(WebSocket conn, ClientHandshake handshake) {
                String id = UUID.randomUUID().toString();
                clientsById.put(id, conn);
                idsByClient.put(conn, id);
                JSObject event = new JSObject();
                event.put("clientId", id);
                notifyListeners("connected", event);
            }

            @Override
            public void onMessage(WebSocket conn, String message) {
                String id = idsByClient.get(conn);
                if (id == null) return;
                JSObject event = new JSObject();
                event.put("clientId", id);
                event.put("data", message);
                notifyListeners("message", event);
            }

            @Override
            public void onClose(WebSocket conn, int code, String reason, boolean remote) {
                String id = idsByClient.remove(conn);
                if (id == null) return;
                clientsById.remove(id);
                JSObject event = new JSObject();
                event.put("clientId", id);
                notifyListeners("disconnected", event);
            }

            @Override
            public void onError(WebSocket conn, Exception ex) {
                if (conn == null && settled.compareAndSet(false, true)) {
                    call.reject("Não foi possível abrir a porta " + port + ": " + ex.getMessage());
                }
            }
        };
        server.setReuseAddr(true);
        server.start();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopServer();
        call.resolve();
    }

    @PluginMethod
    public void send(PluginCall call) {
        String clientId = call.getString("clientId");
        String data = call.getString("data");
        WebSocket conn = clientId == null ? null : clientsById.get(clientId);
        if (conn != null && conn.isOpen() && data != null) conn.send(data);
        call.resolve();
    }

    @PluginMethod
    public void broadcast(PluginCall call) {
        String data = call.getString("data");
        if (server != null && data != null) server.broadcast(data);
        call.resolve();
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        String clientId = call.getString("clientId");
        WebSocket conn = clientId == null ? null : clientsById.get(clientId);
        if (conn != null) conn.close();
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        stopServer();
    }

    private void stopServer() {
        if (server == null) return;
        try {
            server.stop(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        server = null;
        clientsById.clear();
        idsByClient.clear();
    }

    /** IPv4 privado da interface Wi-Fi (prioridade para wlan*), senão qualquer IPv4 não-loopback. */
    private static String lanAddress() {
        String fallback = null;
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (ni.isLoopback() || !ni.isUp()) continue;
                for (InetAddress addr : Collections.list(ni.getInetAddresses())) {
                    if (!(addr instanceof Inet4Address) || addr.isLoopbackAddress()) continue;
                    String ip = addr.getHostAddress();
                    if (ni.getName().startsWith("wlan") && addr.isSiteLocalAddress()) return ip;
                    if (fallback == null || addr.isSiteLocalAddress()) fallback = ip;
                }
            }
        } catch (Exception ignored) {
            // sem interfaces disponíveis
        }
        return fallback != null ? fallback : "0.0.0.0";
    }
}
