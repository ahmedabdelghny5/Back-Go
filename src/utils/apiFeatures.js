class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  pagination() {
    let page = this.queryString.page * 1 || 1;
    if (page < 0) {
      page = 1;
    }
    let limit = 2;
    let skip = (page - 1) * limit;
    this.mongooseQuery.find({}).skip(skip).limit(limit);
    this.page = page;
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.queryString.sort = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery.sort(this.queryString.sort);
    }
    return this;
  }
  filter() {
    let filterObj = { ...this.queryString };
    const queryFilter = ["page", "sort", "select", "search"];
    queryFilter.forEach((q) => {
      delete filterObj[q];
    });
    filterObj = JSON.stringify(filterObj);
    filterObj = filterObj.replace(
      /(gt|gte|lt|lte|in)/g,
      (match) => `$${match}`
    );
    filterObj = JSON.parse(filterObj);
    this.mongooseQuery.find(filterObj);
    return this;
  }

  select() {
    if (this.queryString.select) {
      this.queryString.select = this.queryString.select.split(",").join(" ");
      this.mongooseQuery.select(this.queryString.select);
    }
    return this;
  }

  search() {
    if (this.queryString.search) {
      this.mongooseQuery.find({
          name: { $regex: this.queryString.search, $options: "i" }  
      });
    }
    return this;
  }
}

export default ApiFeatures;
