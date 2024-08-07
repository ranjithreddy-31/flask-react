// ErrorComponent.js
import React from 'react';
import styled from 'styled-components';
import { AiOutlineClose, AiOutlineExclamationCircle } from 'react-icons/ai';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const PopupWrapper = styled.div`
  background-color: #fff;
  color: #a8071a;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  position: relative;
`;

const ErrorMessage = styled.div`
  font-size: 18px;
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  svg {
    margin-right: 8px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #a8071a;
  cursor: pointer;
  position: absolute;
  top: 8px;
  right: 8px;
`;

const ErrorComponent = ({ message, onClose }) => (
  <Overlay>
    <PopupWrapper>
      <ErrorMessage>
        <AiOutlineExclamationCircle size={24} />
        {message}
      </ErrorMessage>
      <CloseButton onClick={onClose}>
        <AiOutlineClose size={24} />
      </CloseButton>
    </PopupWrapper>
  </Overlay>
);

export default ErrorComponent;
