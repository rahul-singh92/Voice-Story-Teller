"use client";

import { Baby, User, Users } from "lucide-react";

interface AgeGroupSelectorProps {
  value: "kids" | "teens" | "adults";
  onChange: (value: "kids" | "teens" | "adults") => void;
}

const AGE_GROUPS = [
  { 
    id: "kids", 
    label: "Kids", 
    icon: Baby,
    age: "5-10",
    description: "Simple & fun"
  },
  { 
    id: "teens", 
    label: "Teens", 
    icon: User,
    age: "11-17",
    description: "Engaging & relatable"
  },
  { 
    id: "adults", 
    label: "Adults", 
    icon: Users,
    age: "18+",
    description: "Complex & mature"
  },
];

export default function AgeGroupSelector({ value, onChange }: AgeGroupSelectorProps) {
  return (
    <div className="mb-6">
      <p className="text-center text-gray-400 mb-4 text-xs md:text-sm uppercase tracking-wider font-semibold">
        Age Group
      </p>
      <div className="grid grid-cols-3 gap-3">
        {AGE_GROUPS.map((group) => {
          const IconComponent = group.icon;
          return (
            <button
              key={group.id}
              onClick={() => onChange(group.id as any)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                value === group.id
                  ? "border-purple-500 bg-purple-600/20 scale-105 shadow-lg shadow-purple-600/30"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900"
              }`}
            >
              <IconComponent 
                className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 transition-transform ${
                  value === group.id ? "text-purple-400 scale-110" : "text-gray-400"
                }`}
              />
              <div className={`text-sm md:text-base font-semibold mb-1 ${
                value === group.id ? "text-white" : "text-gray-400"
              }`}>
                {group.label}
              </div>
              <div className="text-xs text-gray-500">{group.age}</div>
              <div className={`text-xs mt-1 ${
                value === group.id ? "text-purple-400" : "text-gray-600"
              }`}>
                {group.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
