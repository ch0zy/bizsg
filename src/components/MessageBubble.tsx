import { cva } from "class-variance-authority";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  className?: string;
}

const bubbleVariants = cva(
  "rounded-border-radius-8 px-component-space-lg py-component-space-md max-w-[75%]",
  {
    variants: {
      role: {
        user: "bg-action-bg-color-primary text-action-type-color-inverse",
        assistant: "bg-bg-color-alternate text-type-color-body-dark",
      },
    },
    defaultVariants: { role: "assistant" },
  }
);

export function MessageBubble({ role, content, className }: MessageBubbleProps) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start", className)}>
      <div className={bubbleVariants({ role })}>
        {content.split("\n").map((line, i) => (
          <p key={i} className="label-md-regular whitespace-pre-wrap">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
