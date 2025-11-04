import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

function MainPage() {
    const mountRef = useRef(null);
    const navigate = useNavigate();

    const [points, setPoints] = useState(() => {
        const saved = localStorage.getItem("points");
        return saved ? parseInt(saved, 10) : 0;
    });
    const [isRolling, setIsRolling] = useState(false);
    const [result, setResult] = useState(null);
    const [showGoals, setShowGoals] = useState(false);
    const [showConsumes, setShowConsumes] = useState(false);

    const [diceSettings] = useState(() => {
        const saved = localStorage.getItem("diceSettings");
        return saved
            ? JSON.parse(saved)
            : {
                1: { value: 1, comment: "がんばった！" },
                2: { value: 2, comment: "いい感じ！" },
                3: { value: 3, comment: "ナイス！" },
                4: { value: 4, comment: "すごい！" },
                5: { value: 5, comment: "やるね！" },
                6: { value: 6, comment: "最高！！" },
            };
    });

    const [goals, setGoals] = useState(() => {
        const saved = localStorage.getItem("goalSettings");
        return saved
            ? JSON.parse(saved)
            : Array.from({ length: 5 }, () => ({ text: "", dice: 1 }));
    });

    const [consumeSettings, setConsumeSettings] = useState(() => {
        const saved = localStorage.getItem("consumeSettings");
        return saved
            ? JSON.parse(saved)
            : Array.from({ length: 5 }, () => ({ text: "", cost: 10 }));
    });

    useEffect(() => {
        localStorage.setItem("points", points.toString());
    }, [points]);

    const addHistory = (goalText, totalPoints) => {
        const date = new Date().toLocaleDateString("ja-JP");
        const newEntry = { goal: goalText, points: totalPoints, date };
        const history = JSON.parse(localStorage.getItem("goalHistory") || "[]");
        history.push(newEntry);
        localStorage.setItem("goalHistory", JSON.stringify(history));
    };

    // 🎲 3Dダイス
    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            45,
            mount.clientWidth / mount.clientHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.setClearColor(0xf0f0f0);
        mount.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(5, 10, 5);
        scene.add(light);

        const world = new CANNON.World();
        world.gravity.set(0, -9.82, 0);

        // 床
        const floorGeo = new THREE.PlaneGeometry(10, 10);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
        floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(floorBody);

        // 見えない壁
        const wallSize = 3;
        const wallHeight = 1.2;
        function addWall(x, z, rotY) {
            const shape = new CANNON.Box(new CANNON.Vec3(wallSize, wallHeight, 0.05));
            const wall = new CANNON.Body({ mass: 0, shape });
            wall.position.set(x, wallHeight / 2, z);
            wall.quaternion.setFromEuler(0, rotY, 0);
            world.addBody(wall);
        }
        addWall(0, wallSize, 0);
        addWall(0, -wallSize, 0);
        addWall(wallSize, 0, Math.PI / 2);
        addWall(-wallSize, 0, Math.PI / 2);

        // サイコロ
        const diceSize = 1;
        const diceGeo = new RoundedBoxGeometry(diceSize, diceSize, diceSize, 8, 0.15);
        const loader = new THREE.TextureLoader();
        const materials = [1, 2, 3, 4, 5, 6].map((n) =>
            new THREE.MeshStandardMaterial({
                map: loader.load(`/textures/dice${n}.png`),
            })
        );
        const diceMesh = new THREE.Mesh(diceGeo, materials);
        scene.add(diceMesh);

        const diceBody = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            position: new CANNON.Vec3(0, 2, 0),
        });
        world.addBody(diceBody);

        camera.position.set(6, 6, 6);
        camera.lookAt(0, 0, 0);

        const clock = new THREE.Clock();
        const animate = () => {
            const delta = clock.getDelta();
            world.step(1 / 60, delta, 3);
            diceMesh.position.copy(diceBody.position);
            diceMesh.quaternion.copy(diceBody.quaternion);
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        async function rollDice(times = 1, goalText = "") {
            if (isRolling) return;
            setIsRolling(true);
            setResult(null);

            let totalPoints = 0;
            for (let t = 0; t < times; t++) {
                diceBody.position.set(0, 2, 0);
                diceBody.velocity.set((Math.random() - 0.5) * 6, 6, (Math.random() - 0.5) * 6);
                diceBody.angularVelocity.set(
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 12
                );
                await new Promise((res) => setTimeout(res, 3000));

                const up = new THREE.Vector3(0, 1, 0);
                const faces = [
                    { num: 1, normal: new THREE.Vector3(0, 0, 1) },
                    { num: 6, normal: new THREE.Vector3(0, 0, -1) },
                    { num: 2, normal: new THREE.Vector3(0, 1, 0) },
                    { num: 5, normal: new THREE.Vector3(0, -1, 0) },
                    { num: 3, normal: new THREE.Vector3(1, 0, 0) },
                    { num: 4, normal: new THREE.Vector3(-1, 0, 0) },
                ];
                let best = 1,
                    maxDot = -Infinity;
                faces.forEach((f) => {
                    const dot = f.normal.clone().applyQuaternion(diceMesh.quaternion).dot(up);
                    if (dot > maxDot) {
                        maxDot = dot;
                        best = f.num;
                    }
                });
                totalPoints += diceSettings[best].value;
            }

            setResult(`${times}回の合計：${totalPoints}pt`);
            setPoints((p) => p + totalPoints);
            addHistory(goalText || "未設定の目標", totalPoints);
            setIsRolling(false);
        }

        mount.rollDice = rollDice;
        return () => mount.removeChild(renderer.domElement);
    }, []);

    // 🎯 目標選択
    const handleGoal = () => setShowGoals(true);
    const handleSelectGoal = (goal) => {
        setShowGoals(false);
        mountRef.current?.rollDice(goal.dice, goal.text);
    };

    // 💸 消費選択
    const handleConsume = () => setShowConsumes(true);
    const handleSelectConsume = (item) => {
        if (points < item.cost) return;
        setPoints((p) => Math.max(0, p - item.cost));
        setShowConsumes(false);
    };

    return (
        <div style={styles.container}>
            <h1>🎲 3Dチンチロダイス</h1>
            <div style={styles.pointText}>合計ポイント：{points}</div>

            {/* ➕➖ */}
            <div style={styles.adjustButtons}>
                <button style={styles.halfBtnGreen} onClick={() => setPoints((p) => p + 1)}>
                    ＋
                </button>
                <button
                    style={styles.halfBtnRed}
                    onClick={() => setPoints((p) => Math.max(0, p - 1))}
                >
                    −
                </button>
            </div>

            <div ref={mountRef} style={styles.canvasBox} />
            {result && <p>{result}</p>}

            {/* 目標／消費一覧 */}
            {showGoals ? (
                <div>
                    <h3>🎯 達成する目標を選んでください</h3>
                    {goals.map(
                        (goal, i) =>
                            goal.text && (
                                <button
                                    key={i}
                                    onClick={() => handleSelectGoal(goal)}
                                    style={styles.optionBtn}
                                >
                                    {goal.text}（🎲{goal.dice}回）
                                </button>
                            )
                    )}
                    <button onClick={() => setShowGoals(false)} style={styles.cancelBtn}>
                        キャンセル
                    </button>
                </div>
            ) : showConsumes ? (
                <div>
                    <h3>💸 消費項目を選んでください</h3>
                    {consumeSettings.map(
                        (item, i) =>
                            item.text && (
                                <button
                                    key={i}
                                    onClick={() => handleSelectConsume(item)}
                                    style={styles.optionBtn}
                                >
                                    {item.text}（−{item.cost}pt）
                                </button>
                            )
                    )}
                    <button onClick={() => setShowConsumes(false)} style={styles.cancelBtn}>
                        キャンセル
                    </button>
                </div>
            ) : (
                <>
                    {/* 上段 */}
                    <div style={styles.buttonRow}>
                        <button
                            onClick={handleGoal}
                            disabled={isRolling}
                            style={styles.mainButtonGreen}
                        >
                            {isRolling ? "転がしています..." : "目標達成！"}
                        </button>
                        <button onClick={() => navigate("/settings")} style={styles.halfBtnGray}>
                            ⚙️設定
                        </button>
                    </div>

                    {/* 下段 */}
                    <div style={styles.buttonRow}>
                        <button onClick={handleConsume} style={styles.mainButtonOrange}>
                            💸消費
                        </button>
                        <button onClick={() => navigate("/history")} style={styles.halfBtnBrown}>
                            📜履歴
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

const styles = {
    container: {
        textAlign: "center",
        fontFamily: "sans-serif",
        padding: "10px",
        maxWidth: "600px",
        margin: "0 auto",
    },
    pointText: {
        fontSize: "36px",
        fontWeight: "bold",
        color: "#ff5722",
        marginBottom: "10px",
    },
    adjustButtons: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginBottom: "10px",
    },
    halfBtnGreen: {
        width: "50%",
        fontSize: "24px",
        padding: "5px 15px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
    halfBtnRed: {
        width: "50%",
        fontSize: "24px",
        padding: "5px 15px",
        backgroundColor: "#f44336",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
    canvasBox: {
        width: "100%",
        maxWidth: "400px",
        height: "400px",
        margin: "0 auto",
        border: "1px solid #ccc",
        background: "#fafafa",
    },
    buttonRow: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginTop: "10px",
    },
    mainButtonGreen: {
        flex: 1,
        fontSize: "20px",
        padding: "10px 25px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
    mainButtonOrange: {
        flex: 1,
        fontSize: "20px",
        padding: "10px 25px",
        backgroundColor: "#ff7043",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
    halfBtnGray: {
        width: "50%",
        fontSize: "20px",
        padding: "10px 25px",
        backgroundColor: "#607d8b",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
    halfBtnBrown: {
        width: "50%",
        fontSize: "20px",
        padding: "10px 25px",
        backgroundColor: "#795548",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
    optionBtn: {
        display: "block",
        width: "100%",
        maxWidth: "320px",
        margin: "10px auto",
        padding: "10px 15px",
        fontSize: "18px",
        backgroundColor: "#1976d2",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
    cancelBtn: {
        fontSize: "16px",
        marginTop: "10px",
        padding: "8px 20px",
        backgroundColor: "#999",
        color: "white",
        border: "none",
        borderRadius: "6px",
    },
};

export default MainPage;
