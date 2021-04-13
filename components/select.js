import React from "react";
import AsyncSelect from "react-select/async";
import { components } from "react-select";

class Select extends React.Component {
  state = { selection: undefined };

  constructor() {
    super();
    this.styles = {
      control: (base, state) => ({
        ...base,
        //color: state.isFocused ? "red" : "green",
        // This line disable the blue border
        boxShadow: `0 0 0 1px ${this.props.color}`,
        //boxShadow: "none",
        boxShadow: state.isFocused ? `0 0 0 0.2rem ${this.props.color}` : 0,
        borderColor: state.isFocused ? `${this.props.color}` : "#CED4DA",
        "&:hover": {
          borderColor: state.isFocused ? `${this.props.color}` : "#CED4DA",
        },
      }),
    };

    this.option = (props) => {
      return (
        <components.Option {...props}>
          <div style={{ display: "flex" }}>
            <div>{props.data.label}</div>
            <div style={{ paddingLeft: "10px", opacity: 0.5 }}>
              {props.data.rating}
            </div>
          </div>
        </components.Option>
      );
    };
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.value &&
      this.props.dataSet &&
      prevProps.value != this.props.value
    ) {
      let values = this.props.value.filter((profileId) =>
        this.props.dataSet.exists(profileId)
      );
      let newSelectionState = [];
      for (let i = 0; i < values.length; i++) {
        let profileId = values[i];
        newSelectionState.push({
          label: this.props.dataSet.getName(profileId),
          value: profileId,
        });
      }
      this.setState({ selection: newSelectionState });
    }
  }

  handleInputChange = (selection) => {
    // We only want to pass up the values, not the labels
    this.setState({ selection });
    selection = selection ? selection : [];
    let selectionValuesOnly = [];
    for (let i = 0; i < selection.length; i++) {
      selectionValuesOnly.push(selection[i].value);
    }
    this.props.onSelection(selectionValuesOnly);
  };

  promiseOptions = (query) => {
    let data = this.props.dataSet ? this.props.dataSet.getSelectData() : [];

    return new Promise((resolve) => {
      let worker = new Worker("worker.js");
      let args = {
        data: data,
        blacklist: this.props.blacklist,
        query: query,
        limit: 10,
      };
      worker.postMessage(args);
      worker.addEventListener(
        "message",
        function (e) {
          for (let i = 0; i < e.data.length; i++) {
            // Add the rating to the select object
            let ratingOne = this.props.dataSet.getPlayerRating(
              this.props.ratingLabelOne,
              e.data[i].value
            );
            let ratingTwo = this.props.dataSet.getPlayerRating(
              this.props.ratingLabelTwo,
              e.data[i].value
            );
            e.data[i].rating = `${ratingOne ? ratingOne : ""} / ${
              ratingTwo ? ratingTwo : ""
            }`;
          }
          resolve(e.data);
        }.bind(this),
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
        styles={this.styles}
        components={{ Option: this.option }}
      />
    );
  }
}

export default Select;
