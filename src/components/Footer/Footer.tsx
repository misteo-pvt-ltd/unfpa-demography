import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="mt-5 pt-10 pb-10 border-t border-gray-300 bg-white text-center">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-[14px]  font-[400]">
                    © 2026 mistEO. All rights reserved.
                </p>
                {/* <div className="mt-4 flex justify-center gap-6">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Privacy Policy</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Terms of Use</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Data Attribution</span>
                </div> */}
            </div>
        </footer>
    );
};
