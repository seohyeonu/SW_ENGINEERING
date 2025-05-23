import styled from 'styled-components';

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  font-size: 24px;
  color: #454545;

  button {
    width: 18px;
    height: 18px;
    display: flex;
    justify-content: center;
    background-color: white;
    outline: none;
    border: none;
  }
`;

export const CardList = styled.div`
  margin-top: 32px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Card = styled.div`
  box-sizing: border-box;
  width: 100%;
  height: 200px;
  border-radius: 13px;
  box-shadow: rgba(101, 155, 255, 0.3) 0px 4px 16px;
  padding: 20px 32px;
  display: flex;
  flex-direction: column;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 16px;

    .btnWrapper {
      width: 18px;
      height: 18px;
    }

    button {
      width: 18px;
      height: 18px;
      padding: 0;
      display: flex;
      justify-content: center;
      background-color: white;
      outline: none;
      border: none;
    }
  }

  article {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;
  }

  .more {
    width: 100%;
    height: 40px;
    background-color: #659BFF;
    border-radius: 13px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    cursor: pointer;
  }
`;