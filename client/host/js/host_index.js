// electron
const {ipcRenderer, desktopCapturer, screen} = nodeRequire("electron")
// DOM Element
var host_id_h1 = document.getElementById("host_id_h1")
var image_container_div = document.getElementById("image_container")
// RDManager
const cRDManager = new RDHostManager(screen, desktopCapturer)
cRDManager.setRDConnector(SKYWAY_API_KEY, SOCKET_URL)
