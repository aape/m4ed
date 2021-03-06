<%inherit file="/medium/base.mako"/>

<%block name="title">m4ed - New Space</%block>

<%block name="content">
  <div>
    <p><a href='/'>Home</a></p>
    <div>
      ${message}
    </div>
    <form action="${url}" method="post"/>
      <div><label for="title">Title</label></div>
      <input type="text" name="title" value=""/>
      <div><label for="desc">Description</label></div>
      <input type="text" name="desc" value=""/>
      <div></div>
      <input type="hidden" name="csrf_token" value="${csrf_token}"/>
      <input type="submit" name="form.submitted" value="Create"/>
    </form>
  </div>
</%block>
