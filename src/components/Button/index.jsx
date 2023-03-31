import React from 'react';

var stylingObject = {


    backgroundColor: 'transparent',

    border: 'none'
}
const Button = (props) => {
    return (
        <button data-tip data-for={props.tooltip} style={stylingObject} onClick={() => { props.clickHandler(props.idvalue) }}>
            {props.name}

        </button>
    );
};

export default Button;