import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon missing in Leaflet + bundlers
// We don't really use markers here but good to have if we expand
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface GpxMapProps {
    gpxUrl: string
}

function MapRecenter({ positions }: { positions: [number, number][] }) {
    const map = useMap()

    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions)
            map.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [positions, map])

    return null
}

export function GpxMap({ gpxUrl }: GpxMapProps) {
    const [positions, setPositions] = useState<[number, number][]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchGPX() {
            try {
                setLoading(true)
                const response = await fetch(gpxUrl)
                if (!response.ok) throw new Error("Erreur chargement fichier GPX")
                const text = await response.text()

                // Simple XML Parsing
                const parser = new DOMParser()
                const xmlDoc = parser.parseFromString(text, "text/xml")
                const trkpts = xmlDoc.getElementsByTagName("trkpt")

                const coords: [number, number][] = []
                for (let i = 0; i < trkpts.length; i++) {
                    const lat = parseFloat(trkpts[i].getAttribute("lat") || "0")
                    const lon = parseFloat(trkpts[i].getAttribute("lon") || "0")
                    if (lat && lon) coords.push([lat, lon])
                }

                if (coords.length === 0) throw new Error("Pas de tracé valide trouvé dans ce fichier GPX.")
                setPositions(coords)
            } catch (err: any) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (gpxUrl) fetchGPX()
    }, [gpxUrl])

    if (loading) return <div className="h-64 w-full bg-slate-100 flex items-center justify-center text-slate-500 rounded-xl">Chargement de la carte...</div>
    if (error) return <div className="h-64 w-full bg-red-50 flex items-center justify-center text-red-500 rounded-xl px-4 text-center">{error}</div>
    if (positions.length === 0) return null

    return (
        <MapContainer
            center={positions[0]}
            zoom={13}
            scrollWheelZoom={false}
            className="h-96 w-full rounded-xl z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={positions} color="blue" weight={4} />
            <MapRecenter positions={positions} />
        </MapContainer>
    )
}
