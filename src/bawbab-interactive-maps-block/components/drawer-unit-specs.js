import { __ } from '@wordpress/i18n';

const ICONS = {
    area: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M128 96C110.3 96 96 110.3 96 128L96 224C96 241.7 110.3 256 128 256C145.7 256 160 241.7 160 224L160 160L224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L128 96zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 512C96 529.7 110.3 544 128 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480L160 416zM416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160L480 224C480 241.7 494.3 256 512 256C529.7 256 544 241.7 544 224L544 128C544 110.3 529.7 96 512 96L416 96zM544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L512 544C529.7 544 544 529.7 544 512L544 416z"/></svg>,
    fireplace: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M256.5 37.6C265.8 29.8 279.5 30.1 288.4 38.5C300.7 50.1 311.7 62.9 322.3 75.9C335.8 92.4 352 114.2 367.6 140.1C372.8 133.3 377.6 127.3 381.8 122.2C382.9 120.9 384 119.5 385.1 118.1C393 108.3 402.8 96 415.9 96C429.3 96 438.7 107.9 446.7 118.1C448 119.8 449.3 121.4 450.6 122.9C460.9 135.3 474.6 153.2 488.3 175.3C515.5 219.2 543.9 281.7 543.9 351.9C543.9 475.6 443.6 575.9 319.9 575.9C196.2 575.9 96 475.7 96 352C96 260.9 137.1 182 176.5 127C196.4 99.3 216.2 77.1 231.1 61.9C239.3 53.5 247.6 45.2 256.6 37.7zM321.7 480C347 480 369.4 473 390.5 459C432.6 429.6 443.9 370.8 418.6 324.6C414.1 315.6 402.6 315 396.1 322.6L370.9 351.9C364.3 359.5 352.4 359.3 346.2 351.4C328.9 329.3 297.1 289 280.9 268.4C275.5 261.5 265.7 260.4 259.4 266.5C241.1 284.3 207.9 323.3 207.9 370.8C207.9 439.4 258.5 480 321.6 480z"/></svg>,
    sun: <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12 17.5a5.5 5.5 0 100-11 5.5 5.5 0 000 11zm0 1.5a7 7 0 100-14 7 7 0 000 14zm12-7a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h2.5A.75.75 0 0124 12zM4 12a.75.75 0 01-.75.75H.75a.75.75 0 010-1.5h2.5A.75.75 0 014 12zm16.485-8.485a.75.75 0 010 1.06l-1.768 1.768a.75.75 0 01-1.06-1.06l1.767-1.768a.75.75 0 011.061 0zM6.343 17.657a.75.75 0 010 1.06l-1.768 1.768a.75.75 0 11-1.06-1.06l1.767-1.768a.75.75 0 011.061 0zM12 0a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0V.75A.75.75 0 0112 0zm0 20a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0112 20zM3.515 3.515a.75.75 0 011.06 0l1.768 1.768a.75.75 0 11-1.06 1.06L3.515 4.575a.75.75 0 010-1.06zm14.142 14.142a.75.75 0 011.06 0l1.768 1.768a.75.75 0 01-1.06 1.06l-1.768-1.767a.75.75 0 010-1.061z"/></svg>,
    shower: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M128 195.9C128 176.1 144.1 160 163.9 160C173.4 160 182.5 163.8 189.3 170.5L205.5 186.7C184.5 225.6 188.1 274.2 216.4 309.7L215 311C205.6 320.4 205.6 335.6 215 344.9C224.4 354.2 239.6 354.3 248.9 344.9L409 185C418.4 175.6 418.4 160.4 409 151.1C399.6 141.8 384.4 141.7 375.1 151.1L373.8 152.4C338.3 124.1 289.7 120.5 250.8 141.5L234.5 125.3C215.8 106.5 190.4 96 163.9 96C108.7 96 64 140.7 64 195.9L64 512C64 529.7 78.3 544 96 544C113.7 544 128 529.7 128 512L128 195.9zM320 416C337.7 416 352 401.7 352 384C352 366.3 337.7 352 320 352C302.3 352 288 366.3 288 384C288 401.7 302.3 416 320 416zM384 480C384 462.3 369.7 448 352 448C320 480C320 497.7 334.3 512 352 512C369.7 512 384 497.7 384 480zM384 352C401.7 352 416 337.7 416 320C416 302.3 401.7 288 384 288C366.3 288 352 302.3 352 320C352 337.7 366.3 352 384 352zM448 416C448 398.3 433.7 384 416 384C398.3 384 384 398.3 384 416C384 433.7 398.3 448 416 448C433.7 448 448 433.7 448 416zM448 288C465.7 288 480 273.7 480 256C480 238.3 465.7 224 448 224C430.3 224 416 238.3 416 256C416 273.7 430.3 288 448 288zM512 352C512 334.3 497.7 320 480 320C462.3 320 448 334.3 448 352C448 369.7 462.3 384 480 384C497.7 384 512 369.7 512 352zM544 320C561.7 320 576 305.7 576 288C576 270.3 561.7 256 544 256C526.3 256 512 270.3 512 288C512 305.7 526.3 320 544 320z"/></svg>,
    sink: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M288 96C270.3 96 256 110.3 256 128L160 128C142.3 128 128 142.3 128 160C128 177.7 142.3 192 160 192L256 192L256 256L237.3 256C228.8 256 220.7 259.4 214.7 265.4L192 288L96 288C78.3 288 64 302.3 64 320L64 384C64 401.7 78.3 416 96 416L196.1 416C216.3 445 250 464 288 464C326 464 359.7 445 379.9 416L416 416C433.7 416 448 430.3 448 448C448 465.7 462.3 480 480 480L544 480C561.7 480 576 465.7 576 448C576 359.6 504.4 288 416 288L384 288L361.4 265.4C355.4 259.4 347.3 256 338.8 256L320.1 256L320.1 192L416.1 192C433.8 192 448.1 177.7 448.1 160C448.1 142.3 433.8 128 416.1 128L320.1 128C320.1 110.3 305.8 96 288.1 96zM500.8 519.4L482.6 561.8C480.8 565.9 479.9 570.4 479.9 574.9L479.9 576.1C479.9 593.8 494.2 608.1 511.9 608.1C529.6 608.1 543.9 593.8 543.9 576.1L543.9 574.9C543.9 570.4 543 566 541.2 561.8L523 519.4C521.1 514.9 516.7 512 511.8 512C506.9 512 502.6 514.9 500.6 519.4z"/></svg>
};

export const UnitSpecs = ({ specs }) => {
    const { sq_ft, baths, fireplace, sunroom, category } = specs;

    const isResidential = ['residential_apartment', 'cottage'].includes(category);
    if (!isResidential) return null;

    const valBaths = parseFloat(baths) || 0;
    const showerCount = Math.floor(valBaths);
    const sinkCount = Math.ceil(valBaths);

    return (
        <div className="location-specs-container">
            {/* ROW 1: AREA (Full width, centered) */}
            <div className="specs-row area-row">
                <div className="spec-item area-item">
                    <div className="spec-icon-row">
                        <span className="fa-icon">{ICONS.area}</span>
                        <span className="spec-number">{sq_ft || '--'}</span>
                    </div>
                    <span className="spec-label">{__('Area (sq ft)', 'bawbab-interactive-maps')}</span>
                </div>
            </div>

            {/* ROW 2: SHOWER & BATHROOM (2 columns) */}
            <div className="specs-row dual-row">
                <div className="spec-item">
                    <div className="spec-icon-row">
                        <span className="fa-icon">{ICONS.shower}</span>
                        <span className="spec-number">{valBaths > 0 ? `x${showerCount}` : '--'}</span>
                    </div>
                    <span className="spec-label">{__('Shower', 'bawbab-interactive-maps')}</span>
                </div>

                <div className="spec-item">
                    <div className="spec-icon-row">
                        <span className="fa-icon">{ICONS.sink}</span>
                        <span className="spec-number">{valBaths > 0 ? `x${sinkCount}` : '--'}</span>
                    </div>
                    <span className="spec-label">{__('Bathroom', 'bawbab-interactive-maps')}</span>
                </div>
            </div>

            {/* ROW 3: FIREPLACE & SUNROOM (2 columns) */}
            <div className="specs-row dual-row">
                <div className={`spec-item ${!fireplace ? 'is-disabled' : ''}`}>
                    <div className="spec-icon-row">
                        <div className="icon-wrapper">
                            <span className="fa-icon">{ICONS.fireplace}</span>
                            {!fireplace && <span className="no-sign"></span>}
                        </div>
                    </div>
                    <span className="spec-label">{__('Fireplace', 'bawbab-interactive-maps')}</span>
                </div>

                <div className={`spec-item ${!sunroom ? 'is-disabled' : ''}`}>
                    <div className="spec-icon-row">
                        <div className="icon-wrapper">
                            <span className="fa-icon">{ICONS.sun}</span>
                            {!sunroom && <span className="no-sign"></span>}
                        </div>
                    </div>
                    <span className="spec-label">{__('Sunroom', 'bawbab-interactive-maps')}</span>
                </div>
            </div>
        </div>
    );
};