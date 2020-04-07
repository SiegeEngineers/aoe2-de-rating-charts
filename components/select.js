import React from "react";
import AsyncSelect from "react-select/async";

class Select extends React.Component {
  state = { selection: undefined };

  componentDidUpdate(prevProps) {
    if (
      this.props.value &&
      this.props.dataSet &&
      prevProps.value != this.props.value
    ) {
      let values = this.props.value.filter(profileId =>
        this.props.dataSet.exists(profileId)
      );
      let newSelectionState = [];
      for (let i = 0; i < values.length; i++) {
        let profileId = values[i];
        newSelectionState.push({
          label: this.props.dataSet.getName(profileId),
          value: profileId
        });
      }
      this.setState({ selection: newSelectionState });
    }
  }

  handleInputChange = selection => {
    // We only want to pass up the values, not the lables
    this.setState({ selection });
    selection = selection ? selection : [];
    let selectionValuesOnly = [];
    for (let i = 0; i < selection.length; i++) {
      selectionValuesOnly.push(selection[i].value);
    }
    this.props.onSelection(selectionValuesOnly);
  };

  promiseOptions = query => {
    let data = this.props.dataSet ? this.props.dataSet.getSelectData() : [];

    return new Promise(resolve => {
      let worker = new Worker("worker.js");
      let args = {
        data: data,
        blacklist: this.props.blacklist,
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
  };

  render() {
    return (
      <AsyncSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={this.promiseOptions.bind(this)}
        onChange={this.handleInputChange.bind(this)}
        noOptionsMessage={() => "Type a player's name"}
        value={this.state.selection}
      />
    );
  }
}

export default Select;
