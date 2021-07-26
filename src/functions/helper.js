const data = {
  h1: [],
  h2: [],
  h3: [],
  p: [],
};

const setElementsToEdit = () => {
    const p = document.querySelectorAll("p");
    data.p.length = p.length;
    const h1 = document.querySelectorAll("h1");
    data.h1.length = h1.length;
    const h2 = document.querySelectorAll("h2");
    data.h2.length = h2.length;
    const h3 = document.querySelectorAll("h3");
    data.h3.length = h3.length;
    
    return {p, h1, h2, h3}
  };

  const getInputElements = () => {
    const p = document.querySelectorAll('.edit-p');
    const h1 = document.querySelectorAll('.edit-h1');
    const h2 = document.querySelectorAll('.edit-h2');
    const h3 = document.querySelectorAll('.edit-h3');
    return {p, h1, h2, h3}
  }

  const elementsToTextArea = (elementsArray, tag) => {
    elementsArray.forEach((el, index) => {
      const newEl = document.createElement("textarea");
      newEl.value = el.textContent;
      data[tag][index] = newEl.value;
      newEl.classList.add(...el.classList, 'edit-input', `edit-${tag}`);
      el.parentNode.replaceChild(newEl, el);
    });
  };

   

  const inputsToElement = (inputsArray, tag) => {
    inputsArray.forEach((el, index) => {
        const newEl = document.createElement(tag)
        newEl.classList.add(...el.classList)
        newEl.classList.remove('edit-input', `edit-${tag}`)
        if(inputsArray[index].value) newEl.textContent = inputsArray[index].value
        else newEl.textContent = 'Default text'
        data[tag][index] = inputsArray[index].value
        el.parentNode.replaceChild(newEl, el);
    })
  }

  export {setElementsToEdit, getInputElements, elementsToTextArea, inputsToElement}