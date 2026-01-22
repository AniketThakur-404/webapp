
import './StarBorder.css';

const StarBorder = ({
    as: Component = 'button',
    className = '',
    color = 'white',
    speed = '6s',
    thickness = 1,
    children,
    innerClassName = "bg-[#000] text-white",
    ...rest
}) => {
    return (
        <Component
            className={`star-border-container ${className}`}
            style={{
                padding: `${thickness}px 0`,
                ...rest.style
            }}
            {...rest}
        >
            <div
                className="border-gradient-bottom"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animationDuration: speed
                }}
            ></div>
            <div
                className="border-gradient-top"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animationDuration: speed
                }}
            ></div>
            <div className={`inner-content ${innerClassName}`}>{children}</div>
        </Component>
    );
};

export default StarBorder;
