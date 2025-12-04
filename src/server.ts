// import { initSocket } from "./infrastructure/socket/index";
import app from "./app";

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// try{
// initSocket(server, process.env.JWT_SECRET!);
// }catch(err){
//   console.error("Failed to initialize socket:", err);
// }
