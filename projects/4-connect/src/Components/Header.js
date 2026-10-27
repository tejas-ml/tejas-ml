import React from "react";

import {
    GAME_PLAYING,
    GAME_WIN,
    GAME_DRAW
} from "../Constants";

const Header = ({gameState, player}) => {
    const message = () => {
        switch(gameState){
            case GAME_PLAYING:
                return `Player ${player} Turn`;
            case GAME_WIN:
                return `Player ${player % 2 + 1} Wins`;
            case GAME_DRAW:
                return `Game is a Draw!`;
            default:
                return <></>
        }
    }
    return (
        <div className="panel header">
            <div className="header-text">{message()}</div>
        </div>
    )
}

export default Header