export const state = {
    entries: [],
    currentRoomId: null,
    currentMode: "coop",
    roomLocked: false,
    websocket: null,
    currentUser: localStorage.getItem("arcade_user_pseudo") || "",
};
