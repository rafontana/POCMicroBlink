import React from 'react';

const Steps = (props) => {
    return (
        <div className='steps-container'>
            {
                props.stepsTotal.map((item,index)=>(
                    <div key={index} className= {item.active ?  'step-box step-box-active' : 'step-box step-box-inactive'}>
                       <span> {item.number} </span> 
                    </div>
                ))
            }
        </div>
    );
};

export default Steps;