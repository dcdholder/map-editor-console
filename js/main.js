class MapEditorPage extends React.Component {
  constructor(props) {
    super(props);

    this.mapEditorTitle        = "Map Editor";
    this.maxNameLength         = 20;
    this.defaultDimensionsText = "WIDTHxHEIGHT";

    this.defaultMapWidth = 20;
    this.maxMapWidth     = 100;

    this.dimensionsText = this.defaultMapWidth + 'x' + this.defaultMapWidth;

    this.mapContents;
    this.refreshMapContents = this.refreshMapContents.bind(this);

    this.state = {
      mapDimensions: {x: this.defaultMapWidth, y: this.defaultMapWidth}
    };
  }

  refreshMapContents(contents) {
    this.mapContents = contents;
  }

  dimensionsFromDimensionsText() {
    var regex           = /^([0-9]+)[xX]([0-9]+)\s*$/;
    var dimensionsArray = regex.exec(this.dimensionsText);

    if (dimensionsArray!=null && dimensionsArray!=undefined) {
      return {x: dimensionsArray[1], y: dimensionsArray[2]};
    } else {
      return {};
    }
  }

  //grab the value from mapDimensionsText
  resizeMapFromTextUnconditionally(e) {
    var dimensionsFromText = this.dimensionsFromDimensionsText();
    this.resizeMapFromDimensions(dimensionsFromText);
  }

  //the onChange handler here also affects this.dimensionsText
  resizeMapFromTextIfEmpty(e) {
    this.dimensionsText = e.target.value;
    var dimensionsFromText = this.dimensionsFromDimensionsText();

    var allEmpty = true;
    for (let j=0;j<this.state.mapDimensions.y;j++) {
      for (let i=0;i<this.state.mapDimensions.x;i++) {
        if (this.mapContents[j][i]=='w') {
          allEmpty = false;
          break;
        }
      }
      if (!allEmpty) {
        break;
      }
    }

    if (allEmpty) {
      this.resizeMapFromDimensions(dimensionsFromText);
    }
  }

  resizeMapFromDimensions(dimensions) {
    var newDimensions = dimensions;
    if (dimensions!={}) {
      if (dimensions.x>this.maxMapWidth) {
        newDimensions.x = this.maxMapWidth;
      }

      if (dimensions.y>this.maxMapWidth) {
        newDimensions.y = this.maxMapWidth;
      }

      if (dimensions.x<this.maxMapWidth && dimensions.y>this.maxMapWidth) {
        this.hideDimensionsWarning();
      }
    } else {
      newDimensions = {x: this.defaultMapWidth, y: this.defaultMapWidth};
    }

    this.setState({mapDimensions: newDimensions});
  }

  displayDimensionsWarning(e) {
    var dimensionsFromText = this.dimensionsFromDimensionsText();

    var dimensionsWarning = '';
    if (dimensionsFromText=={}) {
      dimensionsWarning = "Malformed input."; //TODO: needs better wording
    } else if(dimensionsFromText.x>this.maxMapWidth) {
      dimensionsWarning = "Width too large."
    } else if(dimensionsFromText.y>this.maxMapWidth) {
      dimensionsWarning = "Height too large."
    }

    if (dimensionsWarning!='') {
      this.setState({
        dimensionsWarning:            dimensionsWarning,
        dimensionsWarningDisplayMode: block
      });
    }
  }

  hideDimensionsWarning() {
    this.setState({dimensionsWarningDisplayMode: "block"});
  }

  render() {
    return (
      <div className="pageContents">
        <h1>{this.mapEditorTitle}</h1>

        <div className="allDetails">
          <details open>
            <summary>Attributes</summary>
            <div className="detailsContents">
              <table>
                <tbody>
                  <tr>
                    <td><label>Name: </label></td>
                    <td><input id="nameText" type="text" size={this.maxNameLength} maxLength={this.maxNameLength} /></td>
                  </tr>
                  <tr>
                    <td><label>Dimensions: </label></td>
                    <td><input id="mapDimensionsText" type="text" size={this.maxNameLength} maxLength={this.maxNameLength} defaultValue={this.defaultMapWidth + "x" + this.defaultMapWidth} placeholder={this.defaultDimensionsText} onChange={(e) => this.resizeMapFromTextIfEmpty(e)} onBlur={() => this.displayDimensionsWarning()} /></td>
                    <td><button onClick={(e) => this.resizeMapFromTextUnconditionally(e)}>Resize</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>

          <details open>
            <summary>Map</summary>
            <div className="detailsContents">
              <MapEditor dimensions={this.state.mapDimensions} contentsRef={this.refreshMapContents} constructionObjects={this.constructionObjects} />
            </div>
          </details>
        </div>

        <button>Save</button>
        <button>Cancel</button>
      </div>
    );
  }
}

class MapEditor extends React.Component {
  constructor(props) {
    super(props);

    this.selectedToolRef   = this.selectedToolRef.bind(this);
    this.selectedObjectRef = this.selectedObjectRef.bind(this);

    this.constructionObjects = {
      "Wall":  [{"material": "Stone", "color": "#696969", "character": 's'}, {"material": "Wood", "color": "#855E42", "character": 'w'}],
      "Floor": [{"material": "Stone", "color": "#A9A9A9", "character": 'S'}, {"material": "Wood", "color": "#AC8468", "character": 'W'}],
      "Door":  [{"material": "Wood", "color": "#C19A6B", "character": 'd'}]
    };

    this.state = {
      selectedTool:      "brush",
      selectedColor:     "white",
      selectedCharacter: "0"
    };
  }

  selectedToolRef(selectedTool) {
    this.setState({selectedTool: selectedTool});
  }

  selectedObjectRef(objectType,objectMaterial) {
    var selectedColor;
    var selectedCharacter;
    for (let objectIndex in this.constructionObjects[objectType]) {
      if (this.constructionObjects[objectType][objectIndex].material===objectMaterial) {
        selectedColor     = this.constructionObjects[objectType][objectIndex].color;
        selectedCharacter = this.constructionObjects[objectType][objectIndex].character;
        break;
      }
    }

    this.setState({
      selectedColor:     selectedColor,
      selectedCharacter: selectedCharacter
    });
  }

  render() {
    return (
      <div className="mapEditor">
        <RoomMap dimensions={this.props.dimensions} contentsRef={this.props.contentsRef} paintTool={this.state.selectedTool} selectedColor={this.state.selectedColor} selectedCharacter={this.state.selectedCharacter} />
        <MapPalette constructionObjects={this.constructionObjects} selectedToolRef={this.selectedToolRef} selectedObjectRef={this.selectedObjectRef} />
      </div>
    );
  }
}

class RoomMap extends React.Component {
  constructor(props) {
    super(props);

    this.floorColor = "white";
    this.wallColor  = "#333333";
  }

  colorOrEraseCell(e,rowIndex,colIndex) {
    if (this.contents[rowIndex][colIndex]=='w') {
      e.target.style.backgroundColor = this.floorColor;
      this.contents[rowIndex][colIndex] = 'f';
    } else {
      e.target.style.backgroundColor = this.wallColor;
      this.contents[rowIndex][colIndex] = 'w';
    }
    this.props.contentsRef(this.contents);
  }

  render() {
    var rows = [];
    this.contents = [];
    for (let j=0;j<this.props.dimensions.y;j++) {
      let cols = [];
      this.contents[j] = [];
      for (let i=0;i<this.props.dimensions.x;i++) {
        cols.push(<td onClick={(e) => {this.colorOrEraseCell(e,j,i)}} style={{backgroundColor: this.floorColor}} name={i+','+j}></td>);
        this.contents[j][i] = 'f';
      }
      this.props.contentsRef(this.contents);

      rows.push(
        <tr>
          {cols}
        </tr>
      );
    }

    return (
      <div className="wallMapWrapper">
        <table className="wallMapTable" id="wallMapTable">
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  }
}

class MapPalette extends React.Component {
  constructor(props) {
    super(props);
    this.iconsPerRow  = 4;
    this.selectedTool = "brush";
  }

  changeTool(toolName) {
    this.props.selectedToolRef(toolName);
    this.selectedTool = toolName;
  }

  changeObject(objectType,objectMaterial) {
    this.props.selectedObjectRef(objectType,objectMaterial);
    this.selectedObjectType     = objectType;
    this.selectedObjectMaterial = objectMaterial;
  }

  render() {
    var constructionObjectsHtml = [];
    for(let objectType in this.props.constructionObjects) {
      let iconTableRows = [];
      for(let rowIndex=0;rowIndex<this.props.constructionObjects[objectType].length/this.iconsPerRow;rowIndex++) {
        let iconTableRowCols = [];
        for(let colIndex=0;colIndex<this.iconsPerRow;colIndex++) {
          let iconClass       = "objectIconTableInvisibleTd";
          let backgroundColor = "white";
          let display         = "hidden";
          let title           = "";
          if (rowIndex*this.iconsPerRow+colIndex<this.props.constructionObjects[objectType].length) {
            iconClass       = "objectIconTableVisibleTd";
            backgroundColor = this.props.constructionObjects[objectType][rowIndex*this.iconsPerRow+colIndex].color;
            display         = "visible";
            title           = this.props.constructionObjects[objectType][rowIndex*this.iconsPerRow+colIndex].material;
          }
          iconTableRowCols.push(
            <td className={iconClass} style={{backgroundColor: backgroundColor, display: display}} title={title} onClick={() => {this.changeObject(objectType,title)}}></td>
          );
        }

        iconTableRows.push(
          <tr>
            {iconTableRowCols}
          </tr>
        );
      }
      constructionObjectsHtml.push(
        <details>
          <summary>{objectType}</summary>
          <div className="detailsContents">
            <table className="objectIconTable">
              <tbody>
                {iconTableRows}
              </tbody>
            </table>
          </div>
        </details>
      );
    }

    return(
      <div className="palette">
        <div className="paletteTitle">
          Construction
        </div>
        <div className="paletteContents">
          <div className="constructionObjects">
            {constructionObjectsHtml}
          </div>
          <div className="paintTool" onClick={() => {this.changeTool("brush")}}>
            Brush
          </div>
          <div className="paintTool" onClick={() => {this.changeTool("bucket")}}>
            Paint Bucket
          </div>
          <div className="paintTool" onClick={() => {this.changeTool("eraser")}}>
            Eraser
          </div>
          <div className="paintTool" onClick={() => {this.changeTool("clear")}}>
            Clear
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <MapEditorPage />,
  document.getElementById('root')
);
