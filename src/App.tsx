import "./App.css";

function App() {
	var connect = new WebSocket("ws://localhost:8080/socket");

	return <h1 className="text-3xl font-bold underline">Hello world!</h1>;
}

export default App;
