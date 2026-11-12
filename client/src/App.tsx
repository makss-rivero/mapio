import MapView from './MapView';

export default function App() {
    return (
        <div className="app">
            <header className="app__header">
                <h1>Mapio</h1>
                <p>Map editor setup</p>
            </header>
            <main className="app__main">
                <MapView />
            </main>
        </div>
    );
}
