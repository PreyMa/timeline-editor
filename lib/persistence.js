
class PersistedItem {
  constructor( type, id ) {
    this.type= type;
    this.id= id;
  }
}

export class PersistedTimeItem extends PersistedItem {
  constructor(
    id, title, description, color,
    expandedSize, isExpanded, categories
  ) {
    super('item', id);

    this.title= title;
    this.description= description;
    this.color= color;
    this.expandedSize= expandedSize;
    this.isExpanded= isExpanded;
    this.categories= categories;
  }
}

export class PersistedTimeBranch extends PersistedItem {
  constructor(
    id, subTimeLineId, branchLineSplitRatio
  ) {
    super('branch', id);

    this.subTimeLineId= subTimeLineId;
    this.branchLineSplitRatio= branchLineSplitRatio;
  }
}

export class PersistedTimeLine {
  constructor(
    id, transformPosition, width
  ) {
    this.id= id;
    this.position= transformPosition;
    this.width= width;
    this.items= [];
  }

  addItem( item ) {
    this.items.push( item );
  }
}
