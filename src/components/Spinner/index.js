import React from 'react';
import Lottie from 'react-lottie';
import spinner from "../../Utils/Animations/spinner.json"

function Loading() {

    const defaultOptions = {
		loop: true,
		autoplay: true,
		animationData: spinner,
		rendererSettings: {
		preserveAspectRatio: 'xMidYMid slice'
		}
	};

    return (

    <div className="poliza-page-spinner">
        <Lottie options={defaultOptions}
        height={400}
        width={400}
        />
    </div>
        
    )
}

export default Loading
