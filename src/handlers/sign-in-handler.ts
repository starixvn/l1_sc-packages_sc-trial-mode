import { Socket } from "socket.io";
import { Config } from "../models/config";

export const handleSignIn = (socketClient: Socket, config: Config) => {
    socketClient.emit(config.name, "signedIn");
    socketClient.emit("message", { toGame: config.name });
};
