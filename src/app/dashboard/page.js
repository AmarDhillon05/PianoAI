"use client"
import Cookies from "js-cookie"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Dashboard(){
    const user = Cookies.get("user")
    const router = useRouter()

    if(user == 'undefined' || user == undefined){
        router.push("/login")
    }

    function newScoreHandler(e){
        Cookies.set("new", true)
        Cookies.set("title", undefined)
        Cookies.set("author", user)
        router.push("/edit")
    }

    useEffect(() => {
        const userScoresDiv = document.getElementById("userScoresList")
        const otherScoresDiv = document.getElementById("otherScoresList")
        const score_button_template = document.getElementById("score_button_template")
        score_button_template.style.visibility = "hidden"

        function applyUserScores(scores){
            Array.from(userScoresDiv.children).forEach(child => {userScoresDiv.removeChild(child)})
            let count = 0;
            scores.forEach(score => {
                count++
                let strScore = score.S
                if(document.getElementById(strScore) == null){
                    let scoreEl = score_button_template.cloneNode(true)
                    scoreEl.style.visibility = "visible"
                    scoreEl.id = strScore
                    scoreEl.querySelector("#title_text").innerHTML = strScore
                    scoreEl.querySelector("#author_text").innerHTML = ""

                    scoreEl.addEventListener("click", () => {
                        Cookies.set("new", false)
                        Cookies.set("title", user + "." + strScore)
                        Cookies.set("author", user)
                        Cookies.set("notes", undefined)
                        router.push("/edit")
                    })

                    userScoresDiv.appendChild(scoreEl)
                }
            })

            document.getElementById("yourScoresInfoText").innerHTML = count === 0 ? "" : ""
            Cookies.set("modified", true)
        }

        var scores = Cookies.get("userScores")
        if(scores == "undefined" || scores == undefined || Cookies.get("modified") == "true"){
            scores = []
            document.getElementById("yourScoresInfoText").innerHTML = "Fetching your scores..."
            fetch("/api/userInfo", {method: "POST", body: JSON.stringify({user : user})})
                .then(data => data.json().then(fetchedScores => {
                    if(fetchedScores.status == 400){
                        document.getElementById("yourScoresErrText").innerHTML = "Unable to retrieve user's scores"
                    } else {
                        Cookies.set("userScores", JSON.stringify(fetchedScores.L))      
                        scores = fetchedScores.L  
                        applyUserScores(scores)  
                    }
                }))
                .catch(() => {
                    document.getElementById("yourScoresErrText").innerHTML = "Unable to retrieve user's scores"
                })
        } else {
            scores = JSON.parse(scores)
            applyUserScores(scores)
        }

        function applyOtherScores(scores){
            Array.from(otherScoresDiv.children).forEach(child => {otherScoresDiv.removeChild(child)})
            let count = 0
            Object.values(scores).forEach(score => {
                count++
                score = JSON.parse(score)
                let title = score.id.replace(score.author, "").slice(1)
                let author = score.author
                if(document.getElementById(score.author + "." + score.id) == null){
                    let scoreEl = score_button_template.cloneNode(true)
                    scoreEl.style.visibility = "visible"
                    scoreEl.id = score.author + "." + title
                    scoreEl.querySelector("#title_text").innerHTML = title
                    scoreEl.querySelector("#author_text").innerHTML = author

                    scoreEl.addEventListener("click", () => {
                        Cookies.set("title", score.id)
                        Cookies.set("author", author)
                        Cookies.set("new", false)
                        Cookies.set("notes", undefined)
                        router.push("/edit")
                    })

                    otherScoresDiv.appendChild(scoreEl)
                }
            })
            document.getElementById("otherScoresInfoText").innerHTML = count === 0 ? "No other scores available" : ""
            Cookies.set("otherModified", false)
        }

        scores = Cookies.get("otherScores")
        if(scores == "undefined" || scores == undefined || Cookies.get("otherModified") == "true"){
            document.getElementById("otherScoresInfoText").innerHTML = "Fetching other scores..."
            fetch("/api/scoreInfo", {method: "POST", body: JSON.stringify({user : user, request : "otherScores"})})
                .then(data => data.json().then(scores => {
                    if(scores.status == 400){
                        document.getElementById("otherScoresErrText").innerHTML = "Unable to retrieve scores"
                    } else {
                        Cookies.set("otherScores", JSON.stringify(scores))
                        applyOtherScores(scores)
                    }
                }))
                .catch(() => {
                    document.getElementById("otherScoresErrText").innerHTML = "Unable to retrieve scores"
                })
        } else {
            scores = JSON.parse(scores)
            applyOtherScores(scores)
        }
    })

    return (
        <div className="bg-black text-white min-h-screen flex flex-col">
            {/* Banner */}
            <div id="banner" className="w-full border-b-2 bg-purple-900 bg-opacity-60 border-purple-900 px-6 py-6 flex items-center justify-between shadow-lg">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide">Dashboard</h1>
                <button
                    className="px-4 py-2 border-2 border-white rounded-lg hover:bg-purple-700 hover:border-purple-400 transition-all duration-200"
                    onClick={() => {
                        Cookies.set("user", undefined)
                        router.push("/login")
                    }}>
                    Logout
                </button>
            </div>

            {/* Your Scores */}
            <section id="userScores" className="mx-6 md:mx-20 py-10 border-t border-purple-800 border-opacity-80">
                <h2 className="font-bold italic text-xl mb-4">Your Scores</h2>
                <div id="userScoresList" className="flex flex-wrap gap-4"></div>
                <p id="yourScoresInfoText" className="text-gray-300"></p>
                <p id="yourScoresErrText" className="text-red-400"></p>
                <button
                    onClick={newScoreHandler}
                    className="mt-4 px-6 py-2 bg-purple-700 rounded-lg border-2 border-purple-500 hover:bg-purple-500 transition-all shadow-md">
                    Create New Score
                </button>
            </section>

            {/* Browse Scores */}
            <section id="otherScores" className="mx-6 md:mx-20 py-10 border-t border-purple-800 border-opacity-80">
                <h2 className="font-bold italic text-xl mb-4">Browse Scores</h2>
                <div id="otherScoresList" className="flex flex-wrap gap-4"></div>
                <p id="otherScoresInfoText" className="text-gray-300"></p>
                <p id="otherScoresErrText" className="text-red-400"></p>
            </section>

            {/* Score Card Template */}
            <button
                id="score_button_template"
                className="transition-all duration-200 bg-white text-black flex flex-row items-center p-3 border-2 border-purple-700 rounded-xl shadow-md hover:shadow-purple-300 hover:border-purple-400 hover:bg-purple-50 min-w-[150px] max-w-[200px]"
            >
                <div className="flex flex-col px-2 text-left">
                    <h1 id="title_text" className="text-md font-bold text-purple-700 truncate">Cry me a river!</h1>
                    <p id="author_text" className="italic text-sm text-gray-700 truncate">Cuz I'm on a Yacht</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="purple" className="ml-auto" viewBox="0 0 16 16">
                    <path d="M12 13c0 1.105-1.12 2-2.5 2S7 14.105 7 13s1.12-2 2.5-2 2.5.895 2.5 2"/>
                    <path fillRule="evenodd" d="M12 3v10h-1V3z"/>
                    <path d="M11 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 16 2.22V4l-5 1z"/>
                    <path fillRule="evenodd" d="M0 11.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 .5 7H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 .5 3H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5"/>
                </svg>
            </button>
        </div>
    )
}
