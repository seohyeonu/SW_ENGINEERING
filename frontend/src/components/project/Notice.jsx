import React, { useState } from 'react'
import styled from 'styled-components'
import { PlusOutlined  } from '@ant-design/icons';
import modalStyles from './css_folder/Notice.module.css';

const Notice = () => {
  const [addNoticeModal, setAddNoticeModal] = useState(false);

  const noticeList = [
    {
      title: '오늘 안에 명세서 작성 다 해오세요', 
      author: '작성자',
      createdAt: '2025.04.20'
    },
    {
      title: '공지할 사항은 여기에 적어주세요', 
      author: '작성자',
      createdAt: '2025.04.20'
    },
    {
      title: '설계서 제출 관련 안내', 
      author: '작성자',
      createdAt: '2025.04.20'
    }
  ]

  return (
    <main>
      <Header>
        <div className='title'>Notice</div>
        <div className='btnWrapper'>
          <button onClick={() => {setAddNoticeModal(true)}}><PlusOutlined/></button>
        </div>
      </Header>
      <List>
        {noticeList.map((a, i) => {
          return (
            <div key={i}>
              <span className='title'>{a.title}</span>
              <span className='author'>{a.author}</span>
              <span className='createdAt'>{a.createdAt}</span>
            </div>
          )
        })}
      </List>

      {/* Notice Modal */}
      {addNoticeModal && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <h2>공지사항 추가</h2> <hr/>
              <label for="notice_title">제목: </label> <br/>
              <input type="text" name="notice_title" id="notice_title" /> <br/>

              <label for="notice_content">내용: </label> <br/>
              <textarea id="notice_content" className={modalStyles.textareaInput}></textarea> <br/>

              <label for="notice_writer">작성자: </label> <br/>
              <input type="text" name="notice_writer" id="notice_writer" /> <br/>

              <div className={modalStyles.modalButtonWrapper}>
                <button id={modalStyles.confirmButton} onClick={() => setAddNoticeModal(false)}>작성 완료</button>
                <button id={modalStyles.cancelButton} onClick={() => setAddNoticeModal(false)}>닫기</button>
              </div>
            </div>
          </div>
        )}
    </main>
  )
}

export default Notice

const Header = styled.header`
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
`

const List = styled.div`
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  width: 100%;
  
  div {
    width: 100%;
    height: 39px;
    display: flex;
    border-bottom: 1px solid #454545;
    align-items: center;
    .title {
      margin-right: auto;
    }
    .author {
      margin-right: 12px;
      color: #454545;
    }
    .createdAt {
      color: #454545;
    }
  }
`