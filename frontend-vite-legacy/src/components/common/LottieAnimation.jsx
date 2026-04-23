import { useLottie } from "lottie-react";

// Placeholder animation data if none provided (Simple pulsing circle)
const defaultAnimation = {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "Placeholder",
    ddd: 0,
    assets: [],
    layers: [
        {
            ddd: 0,
            ind: 1,
            ty: 4,
            nm: "Circle",
            sr: 1,
            ks: {
                o: { a: 1, k: [{ i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [100] }, { t: 30, s: [50] }, { t: 60, s: [100] }] },
                r: { a: 0, k: 0 },
                p: { a: 0, k: [50, 50, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            shapes: [
                {
                    ty: "el",
                    d: 1,
                    p: { a: 0, k: [0, 0] },
                    s: { a: 0, k: [50, 50] }
                },
                {
                    ty: "fl",
                    c: { a: 0, k: [0.23, 0.51, 0.96, 1] }, // Blue
                    o: { a: 0, k: 100 },
                    r: 1,
                    nm: "Fill 1"
                }
            ]
        }
    ]
};

const LottieAnimation = ({ animationData, className }) => {
    const options = {
        animationData: animationData || defaultAnimation,
        loop: true,
        autoplay: true,
    };

    const { View } = useLottie(options);

    return <div className={className}>{View}</div>;
};

export default LottieAnimation;
