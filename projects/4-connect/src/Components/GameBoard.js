import React, {useState} from "react";

import "../Game.css"
import Header from "./Header"
import Footer from "./Footer"

import GameCircle from "./GameCircle";

import { isDraw, isWinner } from "../helper";

import { NO_CIRCLES, NO_PLAYER, PLAYER_1, PLAYER_2, /*GAME_IDLE,*/ GAME_PLAYING, GAME_WIN, GAME_DRAW } from "../Constants";

const GameBoard = () => {
    const [gameBoard, setGameBoard] = useState(Array(16).fill(NO_PLAYER))
    const [currentPlayer, setCurrentPlayer] = useState(PLAYER_1)
    const [gameState, setGameState] = useState(GAME_PLAYING)

    const initBoard = () => {
        const res = []
        for(let i = 0; i < NO_CIRCLES; i++){
            res.push(renderCircle(i))
        }
        return res
    }

    const circleClicked = (id) => {
        console.log("circle clicked:" + id)

        if(gameBoard[id] !== NO_PLAYER) return;
        if(gameState !== GAME_PLAYING) return;

        if(isWinner(gameBoard, id, currentPlayer)){
            setGameState(GAME_WIN)
        }
        if(isDraw(gameBoard, id, currentPlayer)){
            setGameState(GAME_DRAW)
        }

        setGameBoard(prev => {
            return prev.map((circle, pos) => {
                if (pos === id) return currentPlayer
                return circle
            })
        })

        console.log(gameBoard)
        setCurrentPlayer(currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1)
    }

    const renderCircle = (id) => {
        return <GameCircle  key={id} id={id} className={`player_${gameBoard[id]}`} onCircleClicked={circleClicked} />
    }

    return (
        <>
            <Header gameState={gameState} player={currentPlayer} />
            <div className="gameBoard">
                {initBoard()}
            </div>
            <Footer />
        </>
    )
}

 export default GameBoard;