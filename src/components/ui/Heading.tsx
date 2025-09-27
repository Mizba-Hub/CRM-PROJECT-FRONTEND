
import React from "react";

interface HeadingProps {
  title: string;        
  className?: string;   
}

const Heading: React.FC<HeadingProps> = ({ title, className }) => {
  return <h1 className={`text-2xl font-bold text-black ${className || ""}`}>{title}</h1>;
};

export default Heading;
