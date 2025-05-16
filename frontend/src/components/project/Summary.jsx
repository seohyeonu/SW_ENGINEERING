import React from 'react'
import styled from 'styled-components'
import { EllipsisOutlined  } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';

const Summary = () => {

  //서버에서 호출하는것으로 수정필요.
  const projectDetail = {
    article: 'Lorem ipsum dolor sit amet consectetur. Eu ipsum amet aliquam pulvinar. Fermentum gravida vestibulum tempor magna. Elit velit nunc viverra magna. Tristique eget orci sagittis at at. Vitae rhoncus sollicitudin a ac. Molestie gravida ac ac nunc iaculis nibh et. Purus eget urna tempor quisque velit posuere eget adipiscing nullam. Enim tortor ullamcorper mattis adipiscing proin. Lectus dolor et sit pharetra pretium.'
  }

  const handleMenuClick = ({ key }) => {
    if (key === 'edit') {
      alert('수정하기 클릭됨')
      // 수정 로직 추가
    } else if (key === 'delete') {
      alert('삭제하기 클릭됨')
      // 삭제 로직 추가
    }
  }

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="edit">수정하기</Menu.Item>
      <Menu.Item key="delete">삭제하기</Menu.Item>
    </Menu>
  )

  
  return (
    <main>
      <Header>
        <div className='title'>프로젝트 개요</div>
        <div className='btnWrapper'>
          <Dropdown overlay={menu} trigger={['click']}>
            <button><EllipsisOutlined/></button>
          </Dropdown>
        </div>
      </Header>
      <Article>
        <p>{projectDetail.article}</p>
      </Article>
    </main>
  )
}

export default Summary

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

const Article = styled.article`
  margin-top: 24px;
  p {
    margin: 0;
  }
`