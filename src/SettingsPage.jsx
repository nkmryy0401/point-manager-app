import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SettingsPage() {
    const navigate = useNavigate();

    const [goalSettings, setGoalSettings] = useState(() => {
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

    const [diceSettings, setDiceSettings] = useState(() => {
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

    useEffect(() => {
        localStorage.setItem("goalSettings", JSON.stringify(goalSettings));
    }, [goalSettings]);

    useEffect(() => {
        localStorage.setItem("consumeSettings", JSON.stringify(consumeSettings));
    }, [consumeSettings]);

    useEffect(() => {
        localStorage.setItem("diceSettings", JSON.stringify(diceSettings));
    }, [diceSettings]);

    const handleGoalChange = (i, field, value) => {
        const updated = [...goalSettings];
        updated[i][field] = value;
        setGoalSettings(updated);
    };

    const handleConsumeChange = (i, field, value) => {
        const updated = [...consumeSettings];
        updated[i][field] = value;
        setConsumeSettings(updated);
    };

    const handleDiceChange = (num, field, value) => {
        setDiceSettings((prev) => ({
            ...prev,
            [num]: { ...prev[num], [field]: value },
        }));
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>⚙️ 設定</h1>

            {/* 🎯 目標設定 */}
            <h2 style={styles.sectionTitle}>🎯 目標設定</h2>
            {goalSettings.map((goal, i) => (
                <div key={i} style={styles.row}>
                    <label style={styles.label}>目標{i + 1}：</label>
                    <input
                        type="text"
                        value={goal.text}
                        placeholder="目標を入力"
                        onChange={(e) => handleGoalChange(i, "text", e.target.value)}
                        style={styles.textInput}
                    />
                    <label style={styles.label}>🎲数：</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={goal.dice}
                        onChange={(e) => handleGoalChange(i, "dice", Number(e.target.value))}
                        style={styles.numberInput}
                    />
                </div>
            ))}

            {/* 💸 消費設定 */}
            <h2 style={styles.sectionTitle}>💸 消費設定</h2>
            {consumeSettings.map((item, i) => (
                <div key={i} style={styles.row}>
                    <label style={styles.label}>項目{i + 1}：</label>
                    <input
                        type="text"
                        value={item.text}
                        placeholder="消費項目を入力"
                        onChange={(e) => handleConsumeChange(i, "text", e.target.value)}
                        style={styles.textInput}
                    />
                    <label style={styles.label}>消費pt：</label>
                    <input
                        type="number"
                        min="1"
                        value={item.cost}
                        onChange={(e) => handleConsumeChange(i, "cost", Number(e.target.value))}
                        style={styles.numberInput}
                    />
                </div>
            ))}

            {/* 🎲 サイコロ設定 */}
            <h2 style={styles.sectionTitle}>🎲 サイコロ目設定</h2>
            {Object.entries(diceSettings).map(([num, { value, comment }]) => (
                <div key={num} style={styles.row}>
                    <label style={styles.label}>目 {num}：</label>
                    <input
                        type="number"
                        value={value}
                        onChange={(e) =>
                            handleDiceChange(num, "value", Number(e.target.value))
                        }
                        style={styles.numberInput}
                    />
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => handleDiceChange(num, "comment", e.target.value)}
                        style={styles.textInput}
                    />
                </div>
            ))}

            <button onClick={() => navigate("/")} style={styles.backButton}>
                ← メインページに戻る
            </button>
        </div>
    );
}

const styles = {
    container: {
        padding: "10px",
        fontFamily: "sans-serif",
        textAlign: "center",
        maxWidth: "700px",
        margin: "0 auto",
    },
    title: {
        fontSize: "28px",
        marginBottom: "15px",
    },
    sectionTitle: {
        fontSize: "22px",
        marginTop: "30px",
        borderBottom: "2px solid #ccc",
        paddingBottom: "5px",
    },
    row: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        margin: "10px 0",
        gap: "10px",
    },
    label: {
        minWidth: "70px",
        textAlign: "right",
    },
    textInput: {
        flex: "1",
        minWidth: "150px",
        padding: "6px",
        borderRadius: "6px",
        border: "1px solid #ccc",
    },
    numberInput: {
        width: "70px",
        padding: "6px",
        borderRadius: "6px",
        border: "1px solid #ccc",
    },
    backButton: {
        marginTop: "25px",
        width: "100%",
        fontSize: "18px",
        padding: "10px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
};

export default SettingsPage;
