import React from 'react';

const Header = () => {
    return (
        <div className='header-container-div'>
                <img 
                    className='img-fluid logo-sm'
                    alt='swiss-logo' 
                    src={'/assets/renaper/sm-logo.png'}>
                </img>
        </div>
    );
};

export default Header;