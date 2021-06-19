// 定義遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",  //等待翻第一張牌
  SecondCardAwaits: "SecondCardAwaits",  //等待翻第二張牌
  CardsMatchFailed: "CardsMatchFailed",  //配對成功
  CardsMatched: "CardsMatched",  //配對失敗
  GameFinished: "GameFinished",  //完成遊戲
}

const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]


const view = {
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  getCardElement(index) {  //生成卡背
    return `<div data-index="${index}" class="card back"></div>`
  },
  getCardContent(index) {  //生成卡面
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  },

  flipCards(...cards) {  //翻牌
    cards.map(card => {
    if (card.classList.contains('back')) {
      // 回傳正面
      card.classList.remove('back')
      card.innerHTML = this.getCardContent(Number(card.dataset.index))
      return
    }
    // 回傳背面
    card.classList.add('back')
    card.innerHTML = null
    })
  },

  pairCards(...cards) {
    cards.map(card =>{
      card.classList.add("paired")
    })
  },

  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`;
  },

  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`;
  },

  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },  

  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    //   rootElement.innerHTML = utility.getRandomNumberArray(52).map(index => this.getCardElement(index)).join("");
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

const utility = {
  //外面A來的洗牌好用程式碼=>洗牌演算法：Fisher-Yates Shuffle
  //每次call獲得一個洗亂的
  getRandomNumberArray(count) {
    // Array.from: 可以用這個產生一個陣列 (ES6可用)
    // Array.keys():「一個是 0～51 的迭代器」(array Interater)
    // 這兩個搭配使用就產生一個陣列, 從displayCards裡拿到52後就會生出包含0~51
    const number = Array.from(Array(count).keys())
    //從最後一張開始一直做到第二張結束
    for (let index = number.length - 1; index > 0; index--) {
      //決定好每次的那張牌(index)要跟隨機的前面一張交換
      let randomIndex = Math.floor(Math.random() * (index + 1))
        //解構賦值 (destructuring assignment)
        //只要等號兩邊的模式相同，左邊的變數就會被賦予右邊的對應值。
        //注意這邊的分號;不可省略, 要把後面的[]和前面的math.floor()分開
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}


const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }

}

const model = {
  revealedCards: [],
  score: 0,
  triedTimes: 0,

  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`;
  },

  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`;
  }
}

controller.generateCards() // 取代 view.displayCards()

//將每個卡上各自綁好監聽器; arrayLike而不是真的array, 不能用map只能用forEach
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})

