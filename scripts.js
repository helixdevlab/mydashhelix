// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, orderBy, limit } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwBCAvLh3ARkZH_8ax-idcDglLTOX7vds",
  authDomain: "p-analytics-eee6a.firebaseapp.com",
  projectId: "p-analytics-eee6a",
  storageBucket: "p-analytics-eee6a.firebasestorage.app",
  messagingSenderId: "64350593291",
  appId: "1:64350593291:web:cfad8da0b0f08a49b1020e",
  measurementId: "G-PYV51ZZSP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);


// Función para obtener los últimos 50 registros
async function fetchProductivityData() {
    try {
        // Verificar si estamos en un entorno de producción (Firebase Hosting)
        const isProduction = window.location.hostname.includes('firebaseapp.com');
        
        if (!isProduction) {
            // En entorno local, mostrar mensaje de error
            console.warn('Para acceder a datos reales, debes desplegar en Firebase Hosting');
            return [];
        }
        
        const querySnapshot = await getDocs(
            collection(db, "productivity_data"),
            orderBy("timestamp", "desc"),
            limit(50)
        );
        
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data());
        });
        
        return data;
    } catch (error) {
        console.error("Error al obtener datos:", error);
        // En entorno local, devolver datos de ejemplo
        return [
            {
                B_Name: "Juan Pérez",
                C_Team: "GURREN",
                D_Volume: 5.7,
                F_Density: 1.2,
                H_END: 120.5,
                I_ENDTGT: 115.0,
                J_ENDP_PCT: 104.8,
                timestamp: new Date()
            },
            {
                B_Name: "María García",
                C_Team: "SHINY",
                D_Volume: 4.2,
                F_Density: 1.1,
                H_END: 135.2,
                I_ENDTGT: 130.0,
                J_ENDP_PCT: 104.0,
                timestamp: new Date()
            }
        ];
    }
}


// Función para calcular métricas globales
function calculateGlobalMetrics(data) {
    if (data.length === 0) return null;
    
    // MVP del día (persona con mayor porcentaje de cumplimiento)
    const mvp = data.reduce((max, current) => 
        current.J_ENDP_PCT > max.J_ENDP_PCT ? current : max
    );
    
    // Mejor equipo (equipo con mayor promedio de cumplimiento)
    const teams = {};
    data.forEach(item => {
        if (!teams[item.C_Team]) {
            teams[item.C_Team] = { total: 0, count: 0 };
        }
        teams[item.C_Team].total += item.J_ENDP_PCT;
        teams[item.C_Team].count++;
    });
    
    const bestTeam = Object.keys(teams).reduce((best, team) => {
        const avg = teams[team].total / teams[team].count;
        return avg > best.avg ? { team, avg } : best;
    }, { team: "", avg: 0 });
    
    return {
        mvp: mvp.B_Name,
        bestTeam: bestTeam.team
    };
}

// Función para crear filas de la tabla de ranking
function createRankingRow(item, index) {
    const row = document.createElement('div');
    row.className = 'table-row';
    
    // Determinar el color del equipo
    let teamClass = '';
    if (item.C_Team === 'GURREN') teamClass = 'team-gurren';
    else if (item.C_Team === 'SHINY') teamClass = 'team-shiny';
    else if (item.C_Team === 'SOULS') teamClass = 'team-souls';
    
    // Crear barra de progreso
    const progressPercentage = Math.min(100, item.J_ENDP_PCT);
    const progressClass = item.J_ENDP_PCT > 100 ? 'high' : 
                         item.J_ENDP_PCT > 80 ? 'medium' : 'low';
    
    row.innerHTML = `
        <span>${index + 1}</span>
        <span>${item.B_Name}</span>
        <span class="${teamClass}">${item.C_Team}</span>
        <span>${item.I_ENDTGT.toFixed(1)}</span>
        <span>${item.H_END.toFixed(1)}</span>
        <span>
            <div class="progress-container">
                <div class="progress-bar ${progressClass}" style="width: ${progressPercentage}%"></div>
            </div>
            ${item.J_ENDP_PCT.toFixed(1)}%
        </span>
    `;
    
    return row;
}

// Función para renderizar el ranking
function renderRanking(data) {
    const rankingBody = document.getElementById('ranking-body');
    rankingBody.innerHTML = '';
    
    if (data.length === 0) {
        rankingBody.innerHTML = '<p class="no-data">No hay datos disponibles</p>';
        return;
    }
    
    data.forEach((item, index) => {
        const row = createRankingRow(item, index);
        rankingBody.appendChild(row);
    });
}

// Función para actualizar métricas globales
function updateGlobalMetrics(metrics) {
    if (!metrics) return;
    
    document.getElementById('mvp-name').textContent = metrics.mvp;
    document.getElementById('best-team').textContent = metrics.bestTeam;
}

// Función principal
async function initDashboard() {
    // Obtener datos
    const data = await fetchProductivityData();
    
    // Calcular métricas globales
    const metrics = calculateGlobalMetrics(data);
    
    // Actualizar métricas globales
    updateGlobalMetrics(metrics);
    
    // Ordenar por porcentaje de cumplimiento (descendente)
    const sortedData = [...data].sort((a, b) => b.J_ENDP_PCT - a.J_ENDP_PCT);
    
    // Renderizar ranking
    renderRanking(sortedData);
}

// Inicializar el dashboard cuando se cargue la página
document.addEventListener('DOMContentLoaded', initDashboard);

// Actualizar datos cada 30 segundos
setInterval(initDashboard, 30000);
