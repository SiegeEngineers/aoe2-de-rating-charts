import React from "react";
import AsyncSelect from "react-select/async";

class Select extends React.Component {
  state = { selection: undefined };

  handleInputChange = selection => {
    console.log("Selection value changed", selection);
    // We only want to pass up the values, not the lables
    selection = selection ? selection : [];
    let selectionValuesOnly = [];
    for (let i = 0; i < selection.length; i++) {
      selectionValuesOnly.push(selection[i].value);
    }
    this.props.onSelection(selectionValuesOnly);
  };

  promiseOptions = query =>
    new Promise(resolve => {
      let worker = new Worker("worker.js");
      let args = {
        data: this.props.dataSet,
        query: query,
        limit: 10
      };
      worker.postMessage(args);
      worker.addEventListener(
        "message",
        function(e) {
          resolve(e.data);
        },
        false
      );
    });

  render() {
    return (
      <AsyncSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={this.promiseOptions.bind(this)}
        onChange={this.handleInputChange.bind(this)}
      />
    );
  }
}

export default Select;
