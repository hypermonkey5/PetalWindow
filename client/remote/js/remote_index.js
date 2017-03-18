// DOM Element
var remote_id_h1 = document.getElementById("remote_id_h1")
var image_container_div = document.getElementById("image_container")
// RDManager
const cRDManager = new RDRemoteManager()
cRDManager.setRDConnector(SKYWAY_API_KEY, SOCKET_URL)
