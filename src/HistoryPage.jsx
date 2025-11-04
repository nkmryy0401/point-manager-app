import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function HistoryPage() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());

    // 履歴データ取得
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem("goalHistory")) || [];
    } catch {
        history = [];
    }

    // 日ごとに集計
    const dailySummary = history.reduce((acc, entry) => {
        const date = entry.date || "日付不明";
        if (!acc[date]) acc[date] = { goals: {}, total: 0 };
        if (!acc[date].goals[entry.goal]) acc[date].goals[entry.goal] = 0;
        acc[date].goals[entry.goal] += 1;
        acc[date].total += entry.points || 0;
        return acc;
    }, {});

    // カレンダーに目標表示
    const tileContent = ({ date, view }) => {
        if (view !== "month") return null;
        const dateStr = date.toLocaleDateString("ja-JP");
        const record = dailySummary[dateStr];
        if (!record) return null;
        const goals = Object.entries(record.goals)
            .map(([name, count]) => `${name.slice(0, 5)}×${count}`)
            .join(", ");
        return (
            <div style={{ fontSize: "11px", marginTop: "3px", color: "#000" }}>
                {goals}
            </div>
        );
    };

    // 達成日や曜日による色分け
    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            const day = date.getDay();
            const dateStr = date.toLocaleDateString("ja-JP");
            if (day === 0) return "sunday";
            if (day === 6) return "saturday";
            if (dailySummary[dateStr]) return "goal-day";
        }
        return "";
    };

    // 日付選択
    const handleDateClick = (value) => setSelectedDate(value);
    const selectedDateStr = selectedDate.toLocaleDateString("ja-JP");
    const selectedData = dailySummary[selectedDateStr];

    // 🔹 選択日の履歴削除
    const handleDeleteDay = () => {
        if (!selectedData) {
            alert("この日に履歴はありません。");
            return;
        }
        if (window.confirm(`${selectedDateStr} の履歴を削除しますか？`)) {
            const updated = history.filter((item) => item.date !== selectedDateStr);
            localStorage.setItem("goalHistory", JSON.stringify(updated));
            window.location.reload();
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>履歴</h2>

            {/* 📅 カレンダー */}
            <div style={styles.calendarWrapper}>
                <Calendar
                    onClickDay={handleDateClick}
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                    value={selectedDate}
                    locale="ja-JP"
                    calendarType="gregory"
                />
            </div>

            {/* 📆 日別詳細 */}
            <div style={styles.detailBox}>
                <h3 style={{ color: "#000" }}>{selectedDateStr} の記録</h3>
                {selectedData ? (
                    <>
                        <ul style={styles.list}>
                            {Object.entries(selectedData.goals).map(([goal, count]) => (
                                <li key={goal} style={{ color: "#000" }}>
                                    🎯 {goal.slice(0, 5)} × {count}回
                                </li>
                            ))}
                        </ul>
                        <p style={{ fontWeight: "bold", color: "#000" }}>
                            合計ポイント：{selectedData.total} pt
                        </p>

                        {/* 🗑 この日の履歴削除ボタン */}
                        <button onClick={handleDeleteDay} style={styles.deleteButton}>
                            🗑 この日の履歴を削除
                        </button>
                    </>
                ) : (
                    <p style={{ color: "#000" }}>この日に達成記録はありません。</p>
                )}
            </div>

            {/* 🔙 戻るボタン */}
            <div style={styles.buttonArea}>
                <button onClick={() => navigate("/")} style={styles.backButton}>
                    ← メインページに戻る
                </button>
            </div>

            {/* 🌈 カスタムCSS */}
            <style>
                {`
          .react-calendar {
            width: 100%;
            max-width: 600px;
            background: #fff;
            border: none;
            font-size: 1em;
          }

          /* 📆 年月のテキストを黒に */
          .react-calendar__navigation button {
            color: #000 !important;
            font-weight: bold;
          }

          .react-calendar__tile { color: #000 !important; }
          .react-calendar__month-view__days__day.sunday { color: red !important; }
          .react-calendar__month-view__days__day.saturday { color: blue !important; }
          .goal-day { background-color: #ffcc80 !important; border-radius: 6px; }
        `}
            </style>
        </div>
    );
}

const styles = {
    container: {
        textAlign: "center",
        fontFamily: "sans-serif",
        padding: "10px",
        maxWidth: "700px",
        margin: "0 auto",
    },
    title: {
        fontSize: "30px",
        color: "#fff",
        backgroundColor: "#4caf50",
        padding: "10px 0",
        borderRadius: "10px",
        marginBottom: "20px",
    },
    calendarWrapper: {
        width: "100%",
        display: "flex",
        justifyContent: "center",
    },
    detailBox: {
        marginTop: "15px",
        backgroundColor: "#f9f9f9",
        borderRadius: "10px",
        padding: "10px",
        textAlign: "left",
    },
    list: { listStyle: "none", padding: "0", color: "#000" },
    buttonArea: {
        marginTop: "20px",
        display: "flex",
        justifyContent: "center",
    },
    backButton: {
        width: "100%",
        maxWidth: "400px",
        fontSize: "18px",
        padding: "10px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "8px",
    },
    deleteButton: {
        width: "100%",
        marginTop: "10px",
        padding: "10px",
        backgroundColor: "#ff7043",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
    },
};

export default HistoryPage;
