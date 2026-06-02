import { Button, Flex, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

type ErrorBlockAction = {
  label: string;
  onClick?: () => void;
  to?: string;
};

type ErrorBlockProps = {
  actions?: ErrorBlockAction[];
  description: ReactNode;
  icon: ReactNode;
  statusCode: number | string;
  title: string;
  tone: 'error' | 'neutral' | 'warning';
};

export function ErrorBlock({
  actions,
  description,
  icon,
  statusCode,
  title,
  tone,
}: ErrorBlockProps) {
  const navigate = useNavigate();

  return (
    <div
      className="error-block-root flex items-center justify-center overflow-hidden"
      data-tone={tone}
    >
      <div className="error-block-shell flex w-full flex-col items-center text-center">
        <div className="error-block-visual relative flex w-full items-center justify-center">
          <div
            aria-hidden
            className="error-block-icon error-block-tone-color pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            {icon}
          </div>
          <div className="error-block-content relative">
            <Flex align="center" gap={6} vertical>
              <span className="error-block-status-code error-block-tone-color select-none">
                {statusCode}
              </span>
              <div className="error-block-title">
                <Typography.Title level={4}>{title}</Typography.Title>
              </div>
            </Flex>
          </div>
        </div>

        <Flex align="center" gap={8} vertical>
          <div className="error-block-description">
            <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
          </div>
        </Flex>

        {actions && actions.length > 0 ? (
          <Flex gap={12} justify="center" wrap>
            {actions.map((action, index) => (
              <Button
                key={action.to ?? action.label}
                type={index === 0 ? 'primary' : 'default'}
                onClick={() => {
                  if (action.onClick) {
                    action.onClick();
                    return;
                  }

                  if (action.to) {
                    navigate(action.to);
                  }
                }}
              >
                {action.label}
              </Button>
            ))}
          </Flex>
        ) : null}
      </div>
    </div>
  );
}